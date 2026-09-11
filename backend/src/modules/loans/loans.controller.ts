import { Response } from 'express';
import { prisma } from '../../config/db';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';

// Calculate Reducing Balance EMI
function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (annualRate <= 0 || tenureMonths <= 0) return Math.round(principal / (tenureMonths || 1));
  const r = (annualRate / 100) / 12;
  const n = tenureMonths;
  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi * 100) / 100;
}

export async function getLoanProducts(req: AuthenticatedRequest, res: Response) {
  try {
    const products = await prisma.loanProduct.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    });
    return res.json({ success: true, count: products.length, products });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve loan products.' });
  }
}

export async function getLoanApplications(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, search, branchId } = req.query;
    const where: any = {};

    if (status) where.status = String(status);
    if (branchId) where.branchId = String(branchId);
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { applicationNumber: { contains: q } },
        { customer: { firstName: { contains: q } } },
        { customer: { lastName: { contains: q } } },
        { customer: { customerNumber: { contains: q } } }
      ];
    }

    const applications = await prisma.loanApplication.findMany({
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
            phone: true
          }
        },
        loanProduct: true,
        branch: { select: { code: true, name: true } },
        guarantors: true,
        collaterals: true,
        loanAccount: { select: { loanAccountNumber: true, status: true } }
      }
    });

    return res.json({ success: true, count: applications.length, applications });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve loan applications.' });
  }
}

export async function createLoanApplication(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      customerId,
      loanProductId,
      branchId,
      requestedAmount,
      requestedTenureMonths,
      purpose,
      guarantors = [],
      collaterals = []
    } = req.body;

    if (!customerId || !loanProductId || !requestedAmount || !requestedTenureMonths || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Customer, product, requested amount, tenure, and purpose are required.'
      });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    if (customer.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Cannot apply for loan. Customer is in '${customer.status}' state. KYC must be approved.`
      });
    }

    const product = await prisma.loanProduct.findUnique({ where: { id: loanProductId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Loan product not found.' });
    }

    const parsedAmount = Number(requestedAmount);
    if (parsedAmount < product.minAmount || parsedAmount > product.maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Requested amount ₹${parsedAmount.toLocaleString()} is outside product limit (₹${product.minAmount.toLocaleString()} - ₹${product.maxAmount.toLocaleString()}).`
      });
    }

    const currentYear = new Date().getFullYear();
    const appCount = await prisma.loanApplication.count();
    const seq = String(appCount + 1).padStart(5, '0');
    const applicationNumber = `LA-${currentYear}-${seq}`;

    const targetBranchId = branchId || customer.branchId;

    const application = await prisma.loanApplication.create({
      data: {
        applicationNumber,
        customerId,
        loanProductId,
        branchId: targetBranchId,
        requestedAmount: parsedAmount,
        requestedTenureMonths: Number(requestedTenureMonths),
        purpose,
        status: 'SUBMITTED',
        guarantors: {
          create: guarantors.map((g: any) => ({
            name: g.name,
            relationship: g.relationship,
            phone: g.phone,
            pan: g.pan || null,
            occupation: g.occupation || null,
            netWorth: Number(g.netWorth) || 0
          }))
        },
        collaterals: {
          create: collaterals.map((c: any) => ({
            collateralType: c.collateralType || 'PROPERTY',
            description: c.description,
            marketValue: Number(c.marketValue) || 0,
            assessedValue: Number(c.assessedValue) || 0,
            documentRef: c.documentRef || null
          }))
        }
      },
      include: {
        customer: true,
        loanProduct: true,
        guarantors: true,
        collaterals: true
      }
    });

    await createAuditLog(req, {
      action: 'CREATE',
      entityName: 'LOAN_APPLICATION',
      entityId: application.id,
      afterState: application
    });

    return res.status(201).json({
      success: true,
      message: `Loan Application ${application.applicationNumber} submitted successfully.`,
      application
    });
  } catch (err: any) {
    console.error('Error creating loan application:', err);
    return res.status(500).json({ success: false, message: 'Failed to create loan application.' });
  }
}

export async function appraiseLoanApplication(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { riskGrade, appraisalNotes } = req.body;

    if (!riskGrade || !appraisalNotes) {
      return res.status(400).json({ success: false, message: 'Risk grade and appraisal notes are required.' });
    }

    const app = await prisma.loanApplication.findUnique({ where: { id } });
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    const updated = await prisma.loanApplication.update({
      where: { id },
      data: {
        riskGrade,
        appraisalNotes,
        status: 'APPRAISED'
      }
    });

    await createAuditLog(req, {
      action: 'UPDATE',
      entityName: 'LOAN_APPLICATION',
      entityId: id,
      beforeState: app,
      afterState: updated
    });

    return res.json({
      success: true,
      message: `Application ${app.applicationNumber} appraised as ${riskGrade}.`,
      application: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to appraise application.' });
  }
}

export async function sanctionLoanApplication(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { action, sanctionedAmount, sanctionedTenureMonths, interestRate, remarks } = req.body;

    const app = await prisma.loanApplication.findUnique({
      where: { id },
      include: { loanProduct: true }
    });

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (action === 'REJECT') {
      const rejected = await prisma.loanApplication.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: remarks || 'Rejected during credit committee appraisal.'
        }
      });
      return res.json({ success: true, message: 'Loan application rejected.', application: rejected });
    }

    // Sanction Approval
    const finalAmount = Number(sanctionedAmount) || app.requestedAmount;
    const finalTenure = Number(sanctionedTenureMonths) || app.requestedTenureMonths;
    const finalRate = Number(interestRate) || app.loanProduct.interestRate;

    const sanctioned = await prisma.loanApplication.update({
      where: { id },
      data: {
        status: 'SANCTIONED',
        sanctionedAmount: finalAmount,
        sanctionedTenureMonths: finalTenure,
        interestRate: finalRate,
        sanctionedAt: new Date(),
        sanctionedByUserId: req.user?.id
      }
    });

    await createAuditLog(req, {
      action: 'APPROVE',
      entityName: 'LOAN_APPLICATION',
      entityId: id,
      beforeState: app,
      afterState: sanctioned
    });

    return res.json({
      success: true,
      message: `Loan application sanctioned for ₹${finalAmount.toLocaleString()} at ${finalRate}% for ${finalTenure} months.`,
      application: sanctioned
    });
  } catch (err: any) {
    console.error('Error sanctioning loan:', err);
    return res.status(500).json({ success: false, message: 'Failed to sanction loan.' });
  }
}

export async function disburseLoan(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params; // loanApplicationId
    const { savingsAccountId, firstEmiDate } = req.body;

    const app = await prisma.loanApplication.findUnique({
      where: { id },
      include: { customer: true, loanProduct: true }
    });

    if (!app) {
      return res.status(404).json({ success: false, message: 'Loan application not found.' });
    }

    if (app.status !== 'SANCTIONED') {
      return res.status(400).json({
        success: false,
        message: `Only SANCTIONED applications can be disbursed. Current status: '${app.status}'.`
      });
    }

    const sanctionedAmount = app.sanctionedAmount || app.requestedAmount;
    const tenure = app.sanctionedTenureMonths || app.requestedTenureMonths;
    const rate = app.interestRate || app.loanProduct.interestRate;
    const businessDate = req.businessDate || '2026-09-11';

    // Calculate processing fee
    const feePercent = app.loanProduct.processingFeePercent || 1.0;
    const feeAmount = Math.round((sanctionedAmount * feePercent) / 100);
    const netDisbursedAmount = sanctionedAmount - feeAmount;

    // Calculate Monthly EMI
    const emi = calculateEMI(sanctionedAmount, rate, tenure);

    const currentYear = new Date().getFullYear();
    const loanCount = await prisma.loanAccount.count();
    const seq = String(loanCount + 1).padStart(5, '0');
    const loanAccountNumber = `LN-${currentYear}-${seq}`;

    // Maturity Date calculation
    const d = new Date(businessDate);
    d.setMonth(d.getMonth() + tenure);
    const maturityDate = d.toISOString().split('T')[0];

    const targetFirstEmiDate = firstEmiDate || (() => {
      const f = new Date(businessDate);
      f.setMonth(f.getMonth() + 1);
      return f.toISOString().split('T')[0];
    })();

    // Atomic transaction: Create LoanAccount + Installments + Update Savings Account + Double-Entry Transaction Lines
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Loan Account
      const loanAccount = await tx.loanAccount.create({
        data: {
          loanAccountNumber,
          loanApplicationId: app.id,
          customerId: app.customerId,
          loanProductId: app.loanProductId,
          branchId: app.branchId,
          sanctionedAmount,
          disbursedAmount: sanctionedAmount,
          principalOutstanding: sanctionedAmount,
          interestRate: rate,
          interestType: app.loanProduct.interestType,
          tenureMonths: tenure,
          emiAmount: emi,
          disbursementDate: businessDate,
          firstEmiDate: targetFirstEmiDate,
          maturityDate,
          status: 'ACTIVE',
          savingsAccountId: savingsAccountId || null
        }
      });

      // 2. Generate Amortization Schedule (Reducing Balance)
      let currentBal = sanctionedAmount;
      const monthlyRate = (rate / 100) / 12;

      for (let i = 1; i <= tenure; i++) {
        const interestDue = Math.round(currentBal * monthlyRate * 100) / 100;
        const principalDue = i === tenure ? currentBal : Math.round((emi - interestDue) * 100) / 100;
        currentBal = Math.max(0, currentBal - principalDue);

        const instDate = new Date(businessDate);
        instDate.setMonth(instDate.getMonth() + i);
        const dueDate = instDate.toISOString().split('T')[0];

        await tx.loanInstallment.create({
          data: {
            loanAccountId: loanAccount.id,
            installmentNumber: i,
            dueDate,
            principalDue,
            interestDue,
            totalEmi: emi,
            status: 'PENDING'
          }
        });
      }

      // 3. If Savings Account provided, credit net disbursed amount
      if (savingsAccountId) {
        await tx.account.update({
          where: { id: savingsAccountId },
          data: {
            ledgerBalance: { increment: netDisbursedAmount },
            availableBalance: { increment: netDisbursedAmount }
          }
        });
      }

      // 4. Update Application status
      await tx.loanApplication.update({
        where: { id: app.id },
        data: { status: 'DISBURSED' }
      });

      // 5. Post Balanced Double-Entry Financial Entries
      const txCount = await tx.transaction.count();
      const txSeq = String(txCount + 1).padStart(5, '0');
      const txDateCompact = businessDate.replace(/-/g, '');
      const transactionReference = `TXN-${txDateCompact}-${txSeq}`;

      const journalEntries: any[] = [
        {
          glAccountCode: app.loanProduct.glAssetCode || 'GL-1002',
          glAccountName: `Loan Asset (${app.loanProduct.name})`,
          entryType: 'DEBIT',
          amount: sanctionedAmount,
          businessDate
        }
      ];

      if (savingsAccountId) {
        journalEntries.push({
          glAccountCode: 'GL-2001',
          glAccountName: 'Customer Savings Deposit Liability',
          entryType: 'CREDIT',
          amount: netDisbursedAmount,
          businessDate,
          accountId: savingsAccountId
        });
      } else {
        journalEntries.push({
          glAccountCode: 'GL-1001',
          glAccountName: 'Cash in Hand / Disbursement Cheque',
          entryType: 'CREDIT',
          amount: netDisbursedAmount,
          businessDate
        });
      }

      if (feeAmount > 0) {
        journalEntries.push({
          glAccountCode: app.loanProduct.glIncomeCode || 'GL-4001',
          glAccountName: 'Loan Processing Fee Income',
          entryType: 'CREDIT',
          amount: feeAmount,
          businessDate
        });
      }

      await tx.transaction.create({
        data: {
          transactionReference,
          transactionType: 'LOAN_DISBURSEMENT',
          channel: 'BRANCH_TELLER',
          branchId: app.branchId,
          businessDate,
          amount: sanctionedAmount,
          narration: `Disbursement of Loan ${loanAccountNumber} to customer. Net: ₹${netDisbursedAmount.toLocaleString()}, Fee: ₹${feeAmount.toLocaleString()}`,
          status: 'POSTED',
          makerUserId: req.user?.id!,
          destinationAccountId: savingsAccountId || null,
          journalLines: { create: journalEntries }
        }
      });

      return { loanAccount, netDisbursedAmount, feeAmount, emi };
    });

    await createAuditLog(req, {
      action: 'APPROVE',
      entityName: 'LOAN_ACCOUNT',
      entityId: result.loanAccount.id,
      afterState: result,
      businessDate
    });

    return res.status(201).json({
      success: true,
      message: `Loan disbursed successfully (${result.loanAccount.loanAccountNumber}). Net credited: ₹${result.netDisbursedAmount.toLocaleString()} (Processing fee ₹${result.feeAmount.toLocaleString()}). Monthly EMI: ₹${result.emi.toLocaleString()}.`,
      loanAccount: result.loanAccount
    });
  } catch (err: any) {
    console.error('Error disbursing loan:', err);
    return res.status(500).json({ success: false, message: 'Failed to disburse loan.' });
  }
}

export async function getLoanAccounts(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, search, branchId } = req.query;
    const where: any = {};

    if (status) where.status = String(status);
    if (branchId) where.branchId = String(branchId);
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { loanAccountNumber: { contains: q } },
        { customer: { firstName: { contains: q } } },
        { customer: { lastName: { contains: q } } },
        { customer: { customerNumber: { contains: q } } }
      ];
    }

    const loans = await prisma.loanAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            customerNumber: true,
            title: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        loanProduct: true,
        branch: { select: { code: true, name: true } },
        installments: {
          where: { status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } },
          orderBy: { installmentNumber: 'asc' },
          take: 1
        }
      }
    });

    return res.json({ success: true, count: loans.length, loans });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve loan accounts.' });
  }
}

export async function getLoanAccountById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const loan = await prisma.loanAccount.findFirst({
      where: { OR: [{ id }, { loanAccountNumber: id }] },
      include: {
        customer: {
          include: { addresses: true, nominees: true }
        },
        loanProduct: true,
        branch: true,
        loanApplication: {
          include: { guarantors: true, collaterals: true }
        },
        installments: {
          orderBy: { installmentNumber: 'asc' }
        },
        allocations: {
          orderBy: { createdAt: 'desc' },
          include: {
            transaction: { select: { transactionReference: true, createdAt: true } }
          }
        }
      }
    });

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan account not found.' });
    }

    return res.json({ success: true, loan });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve loan details.' });
  }
}

// Waterfall Repayment Engine (Section 11)
export async function repayLoanInstallment(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      loanAccountId,
      amount,
      paymentMethod = 'CASH', // CASH or SAVINGS
      savingsAccountId,
      narration = 'Loan installment repayment'
    } = req.body;

    const parsedAmount = Number(amount);
    if (!loanAccountId || !parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Loan account and positive repayment amount required.' });
    }

    const loan = await prisma.loanAccount.findUnique({
      where: { id: loanAccountId },
      include: {
        loanProduct: true,
        customer: true,
        installments: {
          where: { status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } },
          orderBy: { installmentNumber: 'asc' }
        }
      }
    });

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan account not found.' });
    }

    if (loan.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Loan is already fully paid and closed.' });
    }

    const businessDate = req.businessDate || '2026-09-11';

    // Waterfall Allocation Logic:
    // 1. Late Penalty -> 2. Overdue Interest -> 3. Current Interest -> 4. Principal
    let remainingPayment = parsedAmount;
    let allocatedPenalty = 0;
    let allocatedInterest = 0;
    let allocatedPrincipal = 0;

    const installmentUpdates: any[] = [];

    for (const inst of loan.installments) {
      if (remainingPayment <= 0) break;

      const penaltyDue = inst.penaltyDue - inst.penaltyPaid;
      const interestDue = inst.interestDue - inst.interestPaid;
      const principalDue = inst.principalDue - inst.principalPaid;

      // A. Penalty
      let pPay = 0;
      if (penaltyDue > 0) {
        pPay = Math.min(remainingPayment, penaltyDue);
        allocatedPenalty += pPay;
        remainingPayment -= pPay;
      }

      // B. Interest
      let iPay = 0;
      if (interestDue > 0 && remainingPayment > 0) {
        iPay = Math.min(remainingPayment, interestDue);
        allocatedInterest += iPay;
        remainingPayment -= iPay;
      }

      // C. Principal
      let prPay = 0;
      if (principalDue > 0 && remainingPayment > 0) {
        prPay = Math.min(remainingPayment, principalDue);
        allocatedPrincipal += prPay;
        remainingPayment -= prPay;
      }

      const totalPaidForInst = (inst.principalPaid + prPay) + (inst.interestPaid + iPay);
      const isFullyPaid = totalPaidForInst >= inst.totalEmi;

      installmentUpdates.push({
        id: inst.id,
        principalPaid: inst.principalPaid + prPay,
        interestPaid: inst.interestPaid + iPay,
        penaltyPaid: inst.penaltyPaid + pPay,
        status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
        paidDate: isFullyPaid ? businessDate : null
      });
    }

    // If still remaining after clearing scheduled installments, apply to excess Principal reduction!
    if (remainingPayment > 0) {
      allocatedPrincipal += remainingPayment;
      remainingPayment = 0;
    }

    const newPrincipalOutstanding = Math.max(0, loan.principalOutstanding - allocatedPrincipal);
    const newStatus = newPrincipalOutstanding <= 0 ? 'CLOSED' : 'ACTIVE';

    // Atomic Execution
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Installments
      for (const u of installmentUpdates) {
        await tx.loanInstallment.update({
          where: { id: u.id },
          data: {
            principalPaid: u.principalPaid,
            interestPaid: u.interestPaid,
            penaltyPaid: u.penaltyPaid,
            status: u.status,
            paidDate: u.paidDate
          }
        });
      }

      // 2. Update Loan Account
      const updatedLoan = await tx.loanAccount.update({
        where: { id: loan.id },
        data: {
          principalOutstanding: newPrincipalOutstanding,
          totalPrincipalPaid: { increment: allocatedPrincipal },
          totalInterestPaid: { increment: allocatedInterest },
          totalPenaltyPaid: { increment: allocatedPenalty },
          status: newStatus
        }
      });

      // 3. Post Financial Transaction
      const txCount = await tx.transaction.count();
      const txSeq = String(txCount + 1).padStart(5, '0');
      const txDateCompact = businessDate.replace(/-/g, '');
      const transactionReference = `TXN-${txDateCompact}-${txSeq}`;

      const journalLines: any[] = [
        {
          glAccountCode: paymentMethod === 'SAVINGS' ? 'GL-2001' : 'GL-1001',
          glAccountName: paymentMethod === 'SAVINGS' ? 'Customer Savings Account' : 'Cash in Hand (Teller Drawer)',
          entryType: 'DEBIT',
          amount: parsedAmount,
          businessDate
        }
      ];

      if (allocatedPrincipal > 0) {
        journalLines.push({
          glAccountCode: loan.loanProduct.glAssetCode || 'GL-1002',
          glAccountName: `Loan Principal Asset (${loan.loanProduct.name})`,
          entryType: 'CREDIT',
          amount: allocatedPrincipal,
          businessDate
        });
      }

      if (allocatedInterest > 0) {
        journalLines.push({
          glAccountCode: loan.loanProduct.glIncomeCode || 'GL-4001',
          glAccountName: 'Loan Interest Income',
          entryType: 'CREDIT',
          amount: allocatedInterest,
          businessDate
        });
      }

      if (allocatedPenalty > 0) {
        journalLines.push({
          glAccountCode: 'GL-4003',
          glAccountName: 'Late Repayment Penalty Income',
          entryType: 'CREDIT',
          amount: allocatedPenalty,
          businessDate
        });
      }

      const txn = await tx.transaction.create({
        data: {
          transactionReference,
          transactionType: 'LOAN_REPAYMENT',
          channel: 'BRANCH_TELLER',
          branchId: loan.branchId,
          businessDate,
          amount: parsedAmount,
          narration: `Repayment for Loan ${loan.loanAccountNumber}. Principal: ₹${allocatedPrincipal}, Interest: ₹${allocatedInterest}, Penalty: ₹${allocatedPenalty}`,
          status: 'POSTED',
          makerUserId: req.user?.id!,
          journalLines: { create: journalLines },
          loanAllocations: {
            create: {
              loanAccountId: loan.id,
              totalAmount: parsedAmount,
              allocatedPenalty,
              allocatedOverdueInterest: 0,
              allocatedCurrentInterest: allocatedInterest,
              allocatedPrincipal
            }
          }
        }
      });

      return { txn, updatedLoan };
    });

    await createAuditLog(req, {
      action: 'UPDATE',
      entityName: 'LOAN_REPAYMENT',
      entityId: loan.id,
      afterState: {
        reference: result.txn.transactionReference,
        allocatedPrincipal,
        allocatedInterest,
        allocatedPenalty,
        newPrincipalOutstanding
      },
      businessDate
    });

    return res.json({
      success: true,
      message: `Repayment of ₹${parsedAmount.toLocaleString()} posted successfully.`,
      allocation: {
        principal: allocatedPrincipal,
        interest: allocatedInterest,
        penalty: allocatedPenalty,
        total: parsedAmount,
        remainingLoanBalance: newPrincipalOutstanding,
        loanStatus: newStatus
      },
      transactionReference: result.txn.transactionReference
    });
  } catch (err: any) {
    console.error('Error repaying loan:', err);
    return res.status(500).json({ success: false, message: 'Failed to process loan repayment.' });
  }
}
