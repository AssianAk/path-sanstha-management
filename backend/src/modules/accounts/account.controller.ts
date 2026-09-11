import { Response } from 'express';
import { prisma } from '../../config/db';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';

export async function getAccounts(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, category, status, branchId, customerId } = req.query;

    const where: any = {};
    if (category) {
      where.product = { category: String(category) };
    }
    if (status) {
      where.status = String(status);
    }
    if (branchId) {
      where.branchId = String(branchId);
    }
    if (customerId) {
      where.customerId = String(customerId);
    }
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { accountNumber: { contains: q } },
        { customer: { firstName: { contains: q } } },
        { customer: { lastName: { contains: q } } },
        { customer: { customerNumber: { contains: q } } },
        { customer: { memberNumber: { contains: q } } }
      ];
    }

    const accounts = await prisma.account.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            customerNumber: true,
            isMember: true,
            memberNumber: true,
            title: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true
          }
        },
        product: true,
        branch: { select: { code: true, name: true } },
        termDepositDetail: true
      }
    });

    return res.json({ success: true, count: accounts.length, accounts });
  } catch (err: any) {
    console.error('Error fetching accounts:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve accounts.' });
  }
}

export async function getAccountById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const account = await prisma.account.findFirst({
      where: {
        OR: [{ id }, { accountNumber: id }]
      },
      include: {
        customer: {
          include: {
            addresses: true,
            nominees: true
          }
        },
        product: true,
        branch: true,
        termDepositDetail: true,
        transactionLines: {
          orderBy: { createdAt: 'desc' },
          take: 25,
          include: {
            transaction: {
              select: {
                transactionReference: true,
                transactionType: true,
                narration: true,
                createdAt: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    return res.json({ success: true, account });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve account details.' });
  }
}

export async function openAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      customerId,
      productId,
      branchId,
      initialDeposit = 0,
      nomineeName,
      nomineeRelation,
      // Term Deposit params
      tenureMonths,
      payoutType = 'ON_MATURITY',
      installmentAmount
    } = req.body;

    if (!customerId || !productId) {
      return res.status(400).json({ success: false, message: 'Customer ID and Product ID are required.' });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    if (customer.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Account cannot be opened for customer in '${customer.status}' state. KYC approval required first.`
      });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const targetBranchId = branchId || customer.branchId;
    const businessDate = req.businessDate || '2026-09-11';
    const currentYear = new Date().getFullYear();

    // Generate unique account number: e.g. SB-2026-00003, FD-2026-00002
    const prefix = product.category === 'SAVINGS' ? 'SB' :
                   product.category === 'CURRENT' ? 'CA' :
                   product.category === 'FIXED_DEPOSIT' ? 'FD' : 'RD';

    const accountCount = await prisma.account.count({
      where: { product: { category: product.category } }
    });
    const seq = String(accountCount + 1).padStart(5, '0');
    const accountNumber = `${prefix}-${currentYear}-${seq}`;

    const parsedInitialDeposit = Number(initialDeposit) || 0;
    if (parsedInitialDeposit < product.minBalance && parsedInitialDeposit > 0) {
      return res.status(400).json({
        success: false,
        message: `Initial deposit ₹${parsedInitialDeposit} is lower than minimum balance of ₹${product.minBalance}.`
      });
    }

    // Handle Term Deposit calculations
    let termDepositData: any = null;
    if (product.category === 'FIXED_DEPOSIT' || product.category === 'RECURRING_DEPOSIT') {
      const tenure = Number(tenureMonths) || 12;
      const rate = product.interestRate;
      const principal = parsedInitialDeposit;

      // Maturity date calculation
      const matDate = new Date();
      matDate.setMonth(matDate.getMonth() + tenure);
      const maturityDateStr = matDate.toISOString().split('T')[0];

      // Compound interest projection
      let maturityAmount = principal;
      if (product.category === 'FIXED_DEPOSIT') {
        const timeInYears = tenure / 12;
        const n = product.compoundingFrequency === 'QUARTERLY' ? 4 : product.compoundingFrequency === 'MONTHLY' ? 12 : 1;
        maturityAmount = principal * Math.pow(1 + (rate / 100) / n, n * timeInYears);
      } else {
        // RD compound projection
        const inst = Number(installmentAmount) || 1000;
        maturityAmount = (inst * tenure) + (inst * tenure * (tenure + 1) / (2 * 12) * (rate / 100));
      }

      termDepositData = {
        depositAmount: principal,
        tenureMonths: tenure,
        interestRate: rate,
        maturityDate: maturityDateStr,
        maturityAmount: Math.round(maturityAmount * 100) / 100,
        installmentAmount: Number(installmentAmount) || null,
        payoutType
      };
    }

    // Atomic transaction for account creation and initial deposit posting
    const isTermDeposit = product.category === 'FIXED_DEPOSIT' || product.category === 'RECURRING_DEPOSIT';
    const ledgerBal = parsedInitialDeposit;
    const availBal = isTermDeposit ? 0.0 : parsedInitialDeposit;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Account
      const newAccount = await tx.account.create({
        data: {
          accountNumber,
          customerId,
          productId,
          branchId: targetBranchId,
          ledgerBalance: ledgerBal,
          availableBalance: availBal,
          status: 'ACTIVE',
          nomineeName: nomineeName || null,
          nomineeRelation: nomineeRelation || null,
          ...(termDepositData ? { termDepositDetail: { create: termDepositData } } : {})
        },
        include: {
          product: true,
          customer: true,
          termDepositDetail: true
        }
      });

      // 2. If Initial Deposit > 0, post double-entry transaction
      if (parsedInitialDeposit > 0) {
        const txCount = await tx.transaction.count();
        const txSeq = String(txCount + 1).padStart(5, '0');
        const txDateCompact = businessDate.replace(/-/g, '');
        const transactionReference = `TXN-${txDateCompact}-${txSeq}`;

        // Find or check teller till
        const activeTill = await tx.tellerTill.findFirst({
          where: { branchId: targetBranchId, status: 'OPEN' }
        });

        const txn = await tx.transaction.create({
          data: {
            transactionReference,
            transactionType: 'CASH_DEPOSIT',
            channel: 'BRANCH_TELLER',
            branchId: targetBranchId,
            businessDate,
            destinationAccountId: newAccount.id,
            amount: parsedInitialDeposit,
            narration: `Initial deposit at opening of ${product.name}`,
            status: 'POSTED',
            makerUserId: req.user?.id!,
            tellerTillId: activeTill?.id || null,
            journalLines: {
              create: [
                {
                  glAccountCode: 'GL-1001',
                  glAccountName: 'Cash in Hand / Branch Vault',
                  entryType: 'DEBIT',
                  amount: parsedInitialDeposit,
                  businessDate
                },
                {
                  glAccountCode: product.glAccountCode,
                  glAccountName: `Deposit Liability (${product.name})`,
                  entryType: 'CREDIT',
                  amount: parsedInitialDeposit,
                  businessDate,
                  accountId: newAccount.id
                }
              ]
            }
          }
        });

        // Update active Till balance
        if (activeTill) {
          await tx.tellerTill.update({
            where: { id: activeTill.id },
            data: {
              totalCashReceived: { increment: parsedInitialDeposit },
              currentBalance: { increment: parsedInitialDeposit }
            }
          });
        }
      }

      return newAccount;
    });

    await createAuditLog(req, {
      action: 'CREATE',
      entityName: 'ACCOUNT',
      entityId: result.id,
      afterState: result,
      businessDate
    });

    return res.status(201).json({
      success: true,
      message: `${product.name} account opened successfully (${result.accountNumber})`,
      account: result
    });
  } catch (err: any) {
    console.error('Error opening account:', err);
    return res.status(500).json({ success: false, message: 'Failed to open account.' });
  }
}
