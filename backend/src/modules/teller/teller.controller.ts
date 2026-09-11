import { Response } from 'express';
import { prisma } from '../../config/db';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';

export async function getActiveTill(req: AuthenticatedRequest, res: Response) {
  try {
    const branchId = req.user?.branchId;
    if (!branchId) {
      return res.status(400).json({ success: false, message: 'User not assigned to any branch.' });
    }

    const businessDate = req.businessDate || '2026-09-11';

    let till = await prisma.tellerTill.findFirst({
      where: {
        branchId,
        userId: req.user?.id,
        businessDate,
        status: 'OPEN'
      },
      include: {
        counter: true,
        user: { select: { fullName: true, username: true } },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            destinationAccount: { select: { accountNumber: true } },
            sourceAccount: { select: { accountNumber: true } }
          }
        }
      }
    });

    // If no till opened specifically for this user, look for branch open till
    if (!till) {
      till = await prisma.tellerTill.findFirst({
        where: { branchId, businessDate, status: 'OPEN' },
        include: {
          counter: true,
          user: { select: { fullName: true, username: true } },
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              destinationAccount: { select: { accountNumber: true } },
              sourceAccount: { select: { accountNumber: true } }
            }
          }
        }
      });
    }

    return res.json({ success: true, till, businessDate });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve teller till status.' });
  }
}

export async function openTill(req: AuthenticatedRequest, res: Response) {
  try {
    const { counterId, openingFloat = 25000 } = req.body;
    const branchId = req.user?.branchId;
    const businessDate = req.businessDate || '2026-09-11';

    if (!branchId) {
      return res.status(400).json({ success: false, message: 'Branch ID required.' });
    }

    // Check if open till exists
    const existing = await prisma.tellerTill.findFirst({
      where: { branchId, userId: req.user?.id, businessDate, status: 'OPEN' }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'An open till session already exists for this user today.' });
    }

    const till = await prisma.tellerTill.create({
      data: {
        branchId,
        userId: req.user?.id!,
        counterId: counterId || null,
        businessDate,
        openingBalance: Number(openingFloat),
        currentBalance: Number(openingFloat),
        status: 'OPEN'
      },
      include: { counter: true }
    });

    await createAuditLog(req, {
      action: 'CREATE',
      entityName: 'TELLER_TILL',
      entityId: till.id,
      afterState: till,
      businessDate
    });

    return res.status(201).json({ success: true, message: 'Teller till opened successfully.', till });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to open till.' });
  }
}

export async function processCashDeposit(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      accountNumber,
      amount,
      narration = 'Cash deposit at branch counter',
      denominations = {}
    } = req.body;

    const parsedAmount = Number(amount);
    if (!accountNumber || !parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid account number and positive amount are required.' });
    }

    const account = await prisma.account.findUnique({
      where: { accountNumber },
      include: { product: true, customer: true }
    });

    if (!account) {
      return res.status(404).json({ success: false, message: `Account '${accountNumber}' not found.` });
    }

    if (account.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Account status is '${account.status}'. Deposits are restricted.`
      });
    }

    const branchId = account.branchId;
    const businessDate = req.businessDate || '2026-09-11';

    // Verify till session
    let activeTill = await prisma.tellerTill.findFirst({
      where: { branchId, status: 'OPEN' }
    });

    // Execute atomic transaction
    const txCount = await prisma.transaction.count();
    const txSeq = String(txCount + 1).padStart(5, '0');
    const txDateCompact = businessDate.replace(/-/g, '');
    const transactionReference = `TXN-${txDateCompact}-${txSeq}`;

    const postedTx = await prisma.$transaction(async (tx) => {
      // 1. Credit customer account balance
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          ledgerBalance: { increment: parsedAmount },
          availableBalance: { increment: parsedAmount }
        }
      });

      // 2. Update till
      if (activeTill) {
        activeTill = await tx.tellerTill.update({
          where: { id: activeTill.id },
          data: {
            totalCashReceived: { increment: parsedAmount },
            currentBalance: { increment: parsedAmount }
          }
        });
      }

      // 3. Create Transaction Header
      const transaction = await tx.transaction.create({
        data: {
          transactionReference,
          transactionType: 'CASH_DEPOSIT',
          channel: 'BRANCH_TELLER',
          branchId,
          businessDate,
          destinationAccountId: account.id,
          amount: parsedAmount,
          narration,
          status: 'POSTED',
          makerUserId: req.user?.id!,
          tellerTillId: activeTill?.id || null,
          denomination: {
            create: {
              note2000: Number(denominations.note2000) || 0,
              note500: Number(denominations.note500) || 0,
              note200: Number(denominations.note200) || 0,
              note100: Number(denominations.note100) || 0,
              note50: Number(denominations.note50) || 0,
              note20: Number(denominations.note20) || 0,
              note10: Number(denominations.note10) || 0,
              coins: Number(denominations.coins) || 0,
              totalAmount: parsedAmount
            }
          },
          // 4. Balanced Double-Entry Journal Lines (Debit Cash == Credit Deposit Liability)
          journalLines: {
            create: [
              {
                glAccountCode: 'GL-1001',
                glAccountName: 'Cash in Hand / Branch Vault',
                entryType: 'DEBIT',
                amount: parsedAmount,
                businessDate
              },
              {
                glAccountCode: account.product.glAccountCode,
                glAccountName: `Deposit Liability (${account.product.name})`,
                entryType: 'CREDIT',
                amount: parsedAmount,
                businessDate,
                accountId: account.id
              }
            ]
          }
        },
        include: {
          denomination: true,
          journalLines: true
        }
      });

      return { transaction, updatedAccount };
    });

    await createAuditLog(req, {
      action: 'CREATE',
      entityName: 'TRANSACTION',
      entityId: postedTx.transaction.id,
      afterState: {
        reference: transactionReference,
        amount: parsedAmount,
        account: accountNumber,
        newBalance: postedTx.updatedAccount.availableBalance
      },
      businessDate
    });

    return res.status(201).json({
      success: true,
      message: `Cash deposit of ₹${parsedAmount.toLocaleString()} completed successfully.`,
      transaction: postedTx.transaction,
      newBalance: postedTx.updatedAccount.availableBalance
    });
  } catch (err: any) {
    console.error('Error processing cash deposit:', err);
    return res.status(500).json({ success: false, message: 'Failed to process cash deposit.' });
  }
}

export async function processCashWithdrawal(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      accountNumber,
      amount,
      narration = 'Cash withdrawal at branch counter'
    } = req.body;

    const parsedAmount = Number(amount);
    if (!accountNumber || !parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid account number and positive amount are required.' });
    }

    const account = await prisma.account.findUnique({
      where: { accountNumber },
      include: { product: true, customer: true }
    });

    if (!account) {
      return res.status(404).json({ success: false, message: `Account '${accountNumber}' not found.` });
    }

    if (account.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Account status is '${account.status}'. Withdrawals are restricted.`
      });
    }

    // Balance check
    if (account.availableBalance < parsedAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available funds. Current balance: ₹${account.availableBalance.toLocaleString()}, Requested: ₹${parsedAmount.toLocaleString()}`
      });
    }

    const branchId = account.branchId;
    const businessDate = req.businessDate || '2026-09-11';

    let activeTill = await prisma.tellerTill.findFirst({
      where: { branchId, status: 'OPEN' }
    });

    if (activeTill && activeTill.currentBalance < parsedAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient cash in teller drawer. Available cash: ₹${activeTill.currentBalance.toLocaleString()}`
      });
    }

    const txCount = await prisma.transaction.count();
    const txSeq = String(txCount + 1).padStart(5, '0');
    const txDateCompact = businessDate.replace(/-/g, '');
    const transactionReference = `TXN-${txDateCompact}-${txSeq}`;

    const postedTx = await prisma.$transaction(async (tx) => {
      // 1. Debit customer account
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          ledgerBalance: { decrement: parsedAmount },
          availableBalance: { decrement: parsedAmount }
        }
      });

      // 2. Update till
      if (activeTill) {
        activeTill = await tx.tellerTill.update({
          where: { id: activeTill.id },
          data: {
            totalCashPaid: { increment: parsedAmount },
            currentBalance: { decrement: parsedAmount }
          }
        });
      }

      // 3. Create Transaction Header & Balanced Entries
      const transaction = await tx.transaction.create({
        data: {
          transactionReference,
          transactionType: 'CASH_WITHDRAWAL',
          channel: 'BRANCH_TELLER',
          branchId,
          businessDate,
          sourceAccountId: account.id,
          amount: parsedAmount,
          narration,
          status: 'POSTED',
          makerUserId: req.user?.id!,
          tellerTillId: activeTill?.id || null,
          // Debit Customer Deposit Liability == Credit Cash in Hand
          journalLines: {
            create: [
              {
                glAccountCode: account.product.glAccountCode,
                glAccountName: `Deposit Liability (${account.product.name})`,
                entryType: 'DEBIT',
                amount: parsedAmount,
                businessDate,
                accountId: account.id
              },
              {
                glAccountCode: 'GL-1001',
                glAccountName: 'Cash in Hand / Branch Vault',
                entryType: 'CREDIT',
                amount: parsedAmount,
                businessDate
              }
            ]
          }
        },
        include: { journalLines: true }
      });

      return { transaction, updatedAccount };
    });

    await createAuditLog(req, {
      action: 'CREATE',
      entityName: 'TRANSACTION',
      entityId: postedTx.transaction.id,
      afterState: {
        reference: transactionReference,
        amount: parsedAmount,
        account: accountNumber,
        newBalance: postedTx.updatedAccount.availableBalance
      },
      businessDate
    });

    return res.status(201).json({
      success: true,
      message: `Cash withdrawal of ₹${parsedAmount.toLocaleString()} completed successfully.`,
      transaction: postedTx.transaction,
      newBalance: postedTx.updatedAccount.availableBalance
    });
  } catch (err: any) {
    console.error('Error processing withdrawal:', err);
    return res.status(500).json({ success: false, message: 'Failed to process cash withdrawal.' });
  }
}

export async function balanceTill(req: AuthenticatedRequest, res: Response) {
  try {
    const { tillId, physicalCashCount } = req.body;
    if (!tillId || physicalCashCount === undefined) {
      return res.status(400).json({ success: false, message: 'Till ID and physical cash count are required.' });
    }

    const till = await prisma.tellerTill.findUnique({ where: { id: tillId } });
    if (!till) {
      return res.status(404).json({ success: false, message: 'Till not found.' });
    }

    const difference = Number(physicalCashCount) - till.currentBalance;

    const updated = await prisma.tellerTill.update({
      where: { id: tillId },
      data: {
        closingBalance: Number(physicalCashCount),
        shortageExcess: difference,
        status: 'BALANCED',
        closedAt: new Date(),
        supervisorApprovedBy: req.user?.fullName
      }
    });

    await createAuditLog(req, {
      action: 'UPDATE',
      entityName: 'TELLER_TILL',
      entityId: tillId,
      beforeState: till,
      afterState: updated
    });

    return res.json({
      success: true,
      message: `Teller till balanced successfully. Shortage/Excess: ₹${difference}`,
      till: updated,
      difference
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to balance till.' });
  }
}
