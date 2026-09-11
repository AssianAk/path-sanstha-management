import { Response } from 'express';
import { prisma } from '../../config/db';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';

// Calculate days difference between businessDate (YYYY-MM-DD) and dueDate (YYYY-MM-DD)
function getDaysDifference(businessDateStr: string, dueDateStr: string): number {
  try {
    const [bY, bM, bD] = businessDateStr.split('-').map(Number);
    const [dY, dM, dD] = dueDateStr.split('-').map(Number);
    const bDate = new Date(Date.UTC(bY, bM - 1, bD));
    const dDate = new Date(Date.UTC(dY, dM - 1, dD));
    const diffTime = bDate.getTime() - dDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 0;
  }
}

// 1. Run EOD Overdue & IRAC Asset Classification Batch
export async function runEodClassification(req: AuthenticatedRequest, res: Response) {
  try {
    const businessDate = req.businessDate || '2026-09-11';
    
    // Fetch all active or overdue loan accounts
    const loans = await prisma.loanAccount.findMany({
      where: { status: { in: ['ACTIVE', 'OVERDUE', 'NPA'] } },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' }
        },
        customer: { select: { customerNumber: true, firstName: true, lastName: true } }
      }
    });

    let updatedCount = 0;
    const bucketStats = {
      STANDARD: 0,
      SMA_0: 0,
      SMA_1: 0,
      SMA_2: 0,
      SUB_STANDARD: 0,
      DOUBTFUL_1: 0,
      DOUBTFUL_2: 0,
      DOUBTFUL_3: 0,
      LOSS: 0
    };

    let totalGrossLoanBook = 0;
    let totalGrossNpa = 0;
    let totalProvisionReserve = 0;

    for (const loan of loans) {
      totalGrossLoanBook += loan.principalOutstanding;

      let maxDpd = 0;
      let overduePrincipal = 0;
      let overdueInterest = 0;
      let overduePenalties = 0;

      // Check installments
      for (const inst of loan.installments) {
        if (inst.status === 'PAID') continue;

        const days = getDaysDifference(businessDate, inst.dueDate);
        if (days > 0) {
          if (inst.status !== 'OVERDUE') {
            await prisma.loanInstallment.update({
              where: { id: inst.id },
              data: { status: 'OVERDUE' }
            });
          }
          if (days > maxDpd) {
            maxDpd = days;
          }
          overduePrincipal += (inst.principalDue - inst.principalPaid);
          overdueInterest += (inst.interestDue - inst.interestPaid);
          overduePenalties += (inst.penaltyDue - inst.penaltyPaid);
        }
      }

      // Classification & Provisioning based on RBI / Co-operative IRAC Norms
      let assetClassification = 'STANDARD';
      let provisionPercent = 0.40; // 0.40% standard asset general provision
      let loanStatus = 'ACTIVE';
      let npaDate = loan.npaDate;

      if (maxDpd === 0) {
        assetClassification = 'STANDARD';
        provisionPercent = 0.40;
        loanStatus = 'ACTIVE';
      } else if (maxDpd >= 1 && maxDpd <= 30) {
        assetClassification = 'SMA_0';
        provisionPercent = 0.40;
        loanStatus = 'OVERDUE';
      } else if (maxDpd >= 31 && maxDpd <= 60) {
        assetClassification = 'SMA_1';
        provisionPercent = 0.40;
        loanStatus = 'OVERDUE';
      } else if (maxDpd >= 61 && maxDpd <= 90) {
        assetClassification = 'SMA_2';
        provisionPercent = 0.40;
        loanStatus = 'OVERDUE';
      } else if (maxDpd >= 91 && maxDpd <= 455) {
        // Sub-Standard (NPA up to 12 months)
        assetClassification = 'SUB_STANDARD';
        provisionPercent = 10.0; // 10% provision
        loanStatus = 'NPA';
        if (!npaDate) npaDate = businessDate;
      } else if (maxDpd >= 456 && maxDpd <= 820) {
        // Doubtful 1 (Doubtful up to 1 year)
        assetClassification = 'DOUBTFUL_1';
        provisionPercent = 20.0;
        loanStatus = 'NPA';
        if (!npaDate) npaDate = businessDate;
      } else if (maxDpd >= 821 && maxDpd <= 1550) {
        // Doubtful 2 (Doubtful 1 to 3 years)
        assetClassification = 'DOUBTFUL_2';
        provisionPercent = 30.0;
        loanStatus = 'NPA';
        if (!npaDate) npaDate = businessDate;
      } else {
        // Doubtful 3 / Loss (>3 years doubtful or loss)
        assetClassification = 'DOUBTFUL_3';
        provisionPercent = 100.0;
        loanStatus = 'NPA';
        if (!npaDate) npaDate = businessDate;
      }

      // Calculate required regulatory provision in INR
      const provisionAmount = Math.round(loan.principalOutstanding * (provisionPercent / 100) * 100) / 100;

      // Update Loan Account
      await prisma.loanAccount.update({
        where: { id: loan.id },
        data: {
          dpd: maxDpd,
          assetClassification,
          status: loanStatus,
          npaDate,
          provisionPercent,
          provisionAmount
        }
      });

      bucketStats[assetClassification as keyof typeof bucketStats]++;
      totalProvisionReserve += provisionAmount;
      if (loanStatus === 'NPA') {
        totalGrossNpa += loan.principalOutstanding;
      }

      updatedCount++;
    }

    const grossNpaPercentage = totalGrossLoanBook > 0 
      ? Math.round((totalGrossNpa / totalGrossLoanBook) * 10000) / 100 
      : 0;

    await createAuditLog(req, {
      action: 'UPDATE',
      entityName: 'LOAN_CLASSIFICATION_IRAC',
      entityId: `EOD-${businessDate}`,
      afterState: {
        businessDate,
        updatedCount,
        bucketStats,
        totalGrossLoanBook,
        totalGrossNpa,
        grossNpaPercentage,
        totalProvisionReserve
      },
      businessDate
    });

    return res.json({
      success: true,
      message: `IRAC DPD & Asset Classification batch executed successfully for business date ${businessDate}.`,
      data: {
        businessDate,
        updatedCount,
        bucketStats,
        totalGrossLoanBook,
        totalGrossNpa,
        grossNpaPercentage,
        totalProvisionReserve
      }
    });
  } catch (err: any) {
    console.error('Error running EOD classification:', err);
    return res.status(500).json({ success: false, message: 'Failed to run EOD classification.' });
  }
}

// 2. Collections & NPA Dashboard Overview
export async function getCollectionsDashboard(req: AuthenticatedRequest, res: Response) {
  try {
    const { branchId } = req.query;
    const where: any = {};
    if (branchId) where.branchId = String(branchId);

    const loans = await prisma.loanAccount.findMany({
      where: {
        ...where,
        status: { in: ['ACTIVE', 'OVERDUE', 'NPA'] }
      },
      include: {
        installments: {
          where: { status: 'OVERDUE' }
        }
      }
    });

    let totalLoans = loans.length;
    let totalGrossPortfolio = 0;
    let totalOverdueAmount = 0;
    let grossNpaAmount = 0;
    let totalProvisionReserve = 0;

    const bucketCounts: Record<string, number> = {
      STANDARD: 0,
      SMA_0: 0,
      SMA_1: 0,
      SMA_2: 0,
      SUB_STANDARD: 0,
      DOUBTFUL_1: 0,
      DOUBTFUL_2: 0,
      DOUBTFUL_3: 0,
      LOSS: 0
    };

    const bucketAmounts: Record<string, number> = {
      STANDARD: 0,
      SMA_0: 0,
      SMA_1: 0,
      SMA_2: 0,
      SUB_STANDARD: 0,
      DOUBTFUL_1: 0,
      DOUBTFUL_2: 0,
      DOUBTFUL_3: 0,
      LOSS: 0
    };

    for (const loan of loans) {
      totalGrossPortfolio += loan.principalOutstanding;
      totalProvisionReserve += loan.provisionAmount;

      const cat = loan.assetClassification || 'STANDARD';
      if (bucketCounts[cat] !== undefined) {
        bucketCounts[cat]++;
        bucketAmounts[cat] += loan.principalOutstanding;
      }

      if (['SUB_STANDARD', 'DOUBTFUL_1', 'DOUBTFUL_2', 'DOUBTFUL_3', 'LOSS'].includes(cat)) {
        grossNpaAmount += loan.principalOutstanding;
      }

      for (const inst of loan.installments) {
        totalOverdueAmount += (inst.principalDue - inst.principalPaid) + (inst.interestDue - inst.interestPaid) + (inst.penaltyDue - inst.penaltyPaid);
      }
    }

    const grossNpaPercentage = totalGrossPortfolio > 0 
      ? Math.round((grossNpaAmount / totalGrossPortfolio) * 10000) / 100 
      : 0;

    const noticeCount = await prisma.loanNotice.count();
    const pendingNoticeDispatchCount = await prisma.loanNotice.count({
      where: { deliveryStatus: 'GENERATED' }
    });

    const recentRecoveryActions = await prisma.loanRecoveryAction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        collector: { select: { fullName: true } },
        loanAccount: {
          select: {
            loanAccountNumber: true,
            customer: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    return res.json({
      success: true,
      data: {
        totalLoans,
        totalGrossPortfolio,
        totalOverdueAmount: Math.round(totalOverdueAmount * 100) / 100,
        grossNpaAmount,
        grossNpaPercentage,
        totalProvisionReserve,
        delinquentCount: totalLoans - bucketCounts.STANDARD,
        bucketCounts,
        bucketAmounts,
        noticeCount,
        pendingNoticeDispatchCount,
        recentRecoveryActions
      }
    });
  } catch (err: any) {
    console.error('Error fetching collections dashboard:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve collections dashboard data.' });
  }
}

// 3. Delinquent Accounts Worklist
export async function getDelinquentAccounts(req: AuthenticatedRequest, res: Response) {
  try {
    const { bucket, branchId, collectorId, search } = req.query;
    const where: any = {};

    if (bucket && bucket !== 'ALL') {
      if (bucket === 'NPA') {
        where.assetClassification = { in: ['SUB_STANDARD', 'DOUBTFUL_1', 'DOUBTFUL_2', 'DOUBTFUL_3', 'LOSS'] };
      } else if (bucket === 'DELINQUENT') {
        where.dpd = { gt: 0 };
      } else {
        where.assetClassification = String(bucket);
      }
    } else {
      // Default show all delinquent accounts (DPD > 0)
      where.dpd = { gt: 0 };
    }

    if (branchId) where.branchId = String(branchId);
    if (collectorId) where.assignedCollectorId = String(collectorId);

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { loanAccountNumber: { contains: q } },
        { customer: { firstName: { contains: q } } },
        { customer: { lastName: { contains: q } } },
        { customer: { customerNumber: { contains: q } } },
        { customer: { phone: { contains: q } } }
      ];
    }

    const accounts = await prisma.loanAccount.findMany({
      where,
      orderBy: { dpd: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            customerNumber: true,
            title: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            addresses: true
          }
        },
        loanProduct: { select: { code: true, name: true, category: true } },
        branch: { select: { code: true, name: true } },
        assignedCollector: { select: { id: true, fullName: true, username: true } },
        installments: {
          where: { status: 'OVERDUE' },
          orderBy: { installmentNumber: 'asc' }
        },
        recoveryActions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        notices: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Compute detailed overdue breakdown for each account
    const mappedAccounts = accounts.map(a => {
      let overduePrincipal = 0;
      let overdueInterest = 0;
      let overduePenalty = 0;

      for (const inst of a.installments) {
        overduePrincipal += (inst.principalDue - inst.principalPaid);
        overdueInterest += (inst.interestDue - inst.interestPaid);
        overduePenalty += (inst.penaltyDue - inst.penaltyPaid);
      }

      return {
        ...a,
        overduePrincipal: Math.round(overduePrincipal * 100) / 100,
        overdueInterest: Math.round(overdueInterest * 100) / 100,
        overduePenalty: Math.round(overduePenalty * 100) / 100,
        totalOverdue: Math.round((overduePrincipal + overdueInterest + overduePenalty) * 100) / 100,
        overdueInstallmentsCount: a.installments.length,
        latestAction: a.recoveryActions[0] || null,
        latestNotice: a.notices[0] || null
      };
    });

    return res.json({
      success: true,
      count: mappedAccounts.length,
      accounts: mappedAccounts
    });
  } catch (err: any) {
    console.error('Error fetching delinquent accounts:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve delinquent accounts.' });
  }
}

// 4. Assign Collector to Loan Account
export async function assignCollector(req: AuthenticatedRequest, res: Response) {
  try {
    const { loanAccountId, collectorId } = req.body;
    if (!loanAccountId || !collectorId) {
      return res.status(400).json({ success: false, message: 'Loan Account and Collector ID are required.' });
    }

    const collector = await prisma.user.findUnique({
      where: { id: collectorId },
      include: { role: true }
    });
    if (!collector) {
      return res.status(404).json({ success: false, message: 'Collector user not found.' });
    }

    const loan = await prisma.loanAccount.findUnique({
      where: { id: loanAccountId }
    });
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan Account not found.' });
    }

    const updated = await prisma.loanAccount.update({
      where: { id: loanAccountId },
      data: { assignedCollectorId: collectorId }
    });

    await createAuditLog(req, {
      action: 'UPDATE',
      entityName: 'LOAN_COLLECTOR_ASSIGNMENT',
      entityId: loanAccountId,
      beforeState: { previousCollectorId: loan.assignedCollectorId },
      afterState: { newCollectorId: collectorId, collectorName: collector.fullName },
      businessDate: req.businessDate
    });

    return res.json({
      success: true,
      message: `Assigned Loan ${loan.loanAccountNumber} to recovery officer ${collector.fullName}.`,
      loan: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to assign collector.' });
  }
}

// 5. Log Recovery Action / Field Interaction
export async function logRecoveryAction(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      loanAccountId,
      actionType,
      actionDate,
      customerResponse,
      promisedPaymentDate,
      promisedAmount,
      notes,
      followUpDate
    } = req.body;

    if (!loanAccountId || !actionType || !actionDate || !notes) {
      return res.status(400).json({
        success: false,
        message: 'Loan Account, action type, date, and field notes are required.'
      });
    }

    const businessDate = req.businessDate || '2026-09-11';
    const collectorId = req.user?.id!;

    const action = await prisma.loanRecoveryAction.create({
      data: {
        loanAccountId,
        collectorId,
        actionType,
        actionDate,
        customerResponse,
        promisedPaymentDate,
        promisedAmount: promisedAmount ? Number(promisedAmount) : null,
        notes,
        followUpDate,
        businessDate
      }
    });

    await createAuditLog(req, {
      action: 'CREATE',
      entityName: 'LOAN_RECOVERY_ACTION',
      entityId: action.id,
      afterState: action,
      businessDate
    });

    return res.status(201).json({
      success: true,
      message: `Recovery action logged successfully.`,
      action
    });
  } catch (err: any) {
    console.error('Error logging recovery action:', err);
    return res.status(500).json({ success: false, message: 'Failed to log recovery action.' });
  }
}

// 6. Get Recovery Action History for a Loan
export async function getRecoveryActions(req: AuthenticatedRequest, res: Response) {
  try {
    const { loanAccountId } = req.params;
    const actions = await prisma.loanRecoveryAction.findMany({
      where: { loanAccountId },
      orderBy: { createdAt: 'desc' },
      include: {
        collector: { select: { fullName: true, username: true, role: { select: { name: true } } } }
      }
    });

    return res.json({ success: true, count: actions.length, actions });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve recovery action history.' });
  }
}

// 7. Generate Formal Demand / Legal Notice
export async function generateNotice(req: AuthenticatedRequest, res: Response) {
  try {
    const { loanAccountId, noticeType, dispatchMedium = 'REGISTERED_POST' } = req.body;

    if (!loanAccountId || !noticeType) {
      return res.status(400).json({ success: false, message: 'Loan Account and Notice Type are required.' });
    }

    const loan = await prisma.loanAccount.findUnique({
      where: { id: loanAccountId },
      include: {
        customer: {
          include: { addresses: true }
        },
        loanProduct: true,
        branch: true,
        installments: {
          where: { status: 'OVERDUE' },
          orderBy: { installmentNumber: 'asc' }
        }
      }
    });

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan Account not found.' });
    }

    let overduePrincipal = 0;
    let overdueInterest = 0;
    let penalCharges = 0;

    for (const inst of loan.installments) {
      overduePrincipal += (inst.principalDue - inst.principalPaid);
      overdueInterest += (inst.interestDue - inst.interestPaid);
      penalCharges += (inst.penaltyDue - inst.penaltyPaid);
    }

    const dueAmount = overduePrincipal + overdueInterest + penalCharges;
    const currentYear = new Date().getFullYear();
    const noticeCount = await prisma.loanNotice.count();
    const seq = String(noticeCount + 1).padStart(5, '0');
    const noticeNumber = `NOT-${currentYear}-${seq}`;
    const businessDate = req.businessDate || '2026-09-11';

    // Build legal notice content based on notice type
    let noticeTitle = 'DEMAND NOTICE / मागणी नोटीस';
    let legalActSection = 'Co-operative Bank Bye-laws';
    let noticeText = '';

    const custName = `${loan.customer.title || 'Shri'} ${loan.customer.firstName} ${loan.customer.lastName}`;
    const branchName = loan.branch.name;

    if (noticeType === 'REMINDER_1') {
      noticeTitle = 'OVERDUE EMI REMINDER NOTICE / हप्ता भरणा स्मरणपत्र';
      legalActSection = 'Loan Agreement Clause 7';
      noticeText = `Dear ${custName}, your loan account ${loan.loanAccountNumber} has ${loan.installments.length} overdue installment(s) totaling ₹${dueAmount.toLocaleString()}. Please clear the dues within 7 days to maintain a clean CIBIL credit score.`;
    } else if (noticeType === 'DEMAND_2') {
      noticeTitle = 'FORMAL DEMAND NOTICE / थकबाकी वसुली मागणी नोटीस';
      legalActSection = 'Loan Agreement & Bye-law 42';
      noticeText = `Notice is hereby served upon you (${custName}) for default of ₹${dueAmount.toLocaleString()} in Loan Account ${loan.loanAccountNumber}. You are given 15 days to liquidate this default, failing which your account will be reported to CIBIL and classified as Non-Performing Asset (NPA).`;
    } else if (noticeType === 'FINAL_RECALL_3') {
      noticeTitle = 'FINAL LOAN RECALL NOTICE / कर्ज वसुली अंतिम ताकीद नोटीस';
      legalActSection = 'Section 91 & Loan Security Deed';
      noticeText = `You (${custName}) and your guarantors have continuously failed to honor loan covenants. The Bank hereby recalls the entire principal outstanding of ₹${loan.principalOutstanding.toLocaleString()} plus overdue interest and penalties totaling ₹${dueAmount.toLocaleString()}. Failure to pay within 7 days will result in attachment of pledged assets.`;
    } else if (noticeType === 'SEC_101_COOP') {
      noticeTitle = 'STATUTORY NOTICE UNDER SECTION 101 OF MCS ACT, 1960 / कलम १०१ अन्वये दाखला मागणी नोटीस';
      legalActSection = 'Maharashtra Co-operative Societies Act 1960, Section 101';
      noticeText = `Take notice that in default of payment of ₹${dueAmount.toLocaleString()} towards Loan ${loan.loanAccountNumber}, the Bank is initiating proceedings before the Assistant Registrar, Co-operative Societies, for issuance of a Recovery Certificate under Section 101 for realization by attachment and sale of movable and immovable property.`;
    } else if (noticeType === 'SEC_138_NI') {
      noticeTitle = 'STATUTORY LEGAL NOTICE UNDER SECTION 138 OF NI ACT / कलम १३८ अन्वये नोटीस';
      legalActSection = 'Negotiable Instruments Act 1881, Section 138';
      noticeText = `Notice is hereby issued for dishonor of repayment instruments. You are called upon to make payment within 15 days from receipt of this notice, failing which criminal proceedings shall be instituted in the Court of Judicial Magistrate First Class.`;
    }

    const notice = await prisma.loanNotice.create({
      data: {
        noticeNumber,
        loanAccountId,
        noticeType,
        generatedDate: businessDate,
        dueAmount,
        principalOverdue: overduePrincipal,
        interestOverdue: overdueInterest,
        penalCharges,
        dispatchMedium,
        deliveryStatus: 'GENERATED',
        content: noticeText,
        generatedByUserId: req.user?.id!,
        businessDate
      }
    });

    await createAuditLog(req, {
      action: 'CREATE',
      entityName: 'LOAN_NOTICE',
      entityId: notice.id,
      afterState: { noticeNumber, noticeType, dueAmount, recipient: custName },
      businessDate
    });

    return res.status(201).json({
      success: true,
      message: `Notice ${notice.noticeNumber} generated successfully.`,
      notice: {
        ...notice,
        title: noticeTitle,
        legalSection: legalActSection,
        borrowerName: custName,
        loanAccountNumber: loan.loanAccountNumber,
        branchName
      }
    });
  } catch (err: any) {
    console.error('Error generating notice:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate demand notice.' });
  }
}

// 8. Get All Notices Register
export async function getNotices(req: AuthenticatedRequest, res: Response) {
  try {
    const { loanAccountId, noticeType, deliveryStatus, search } = req.query;
    const where: any = {};

    if (loanAccountId) where.loanAccountId = String(loanAccountId);
    if (noticeType) where.noticeType = String(noticeType);
    if (deliveryStatus) where.deliveryStatus = String(deliveryStatus);

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { noticeNumber: { contains: q } },
        { dispatchRef: { contains: q } },
        { loanAccount: { loanAccountNumber: { contains: q } } },
        { loanAccount: { customer: { firstName: { contains: q } } } },
        { loanAccount: { customer: { lastName: { contains: q } } } }
      ];
    }

    const notices = await prisma.loanNotice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        generatedByUser: { select: { fullName: true, username: true } },
        loanAccount: {
          select: {
            id: true,
            loanAccountNumber: true,
            principalOutstanding: true,
            dpd: true,
            assetClassification: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
                title: true,
                phone: true,
                addresses: true
              }
            },
            branch: { select: { name: true, code: true } }
          }
        }
      }
    });

    return res.json({ success: true, count: notices.length, notices });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve notices register.' });
  }
}

// 9. Update Notice Dispatch / Delivery Status
export async function updateNoticeStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { deliveryStatus, dispatchRef, dispatchedDate, deliveredDate } = req.body;

    const notice = await prisma.loanNotice.findUnique({ where: { id } });
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found.' });
    }

    const data: any = {};
    if (deliveryStatus) data.deliveryStatus = deliveryStatus;
    if (dispatchRef) data.dispatchRef = dispatchRef;
    if (dispatchedDate) data.dispatchedDate = dispatchedDate;
    if (deliveredDate) data.deliveredDate = deliveredDate;

    const updated = await prisma.loanNotice.update({
      where: { id },
      data
    });

    await createAuditLog(req, {
      action: 'UPDATE',
      entityName: 'LOAN_NOTICE_STATUS',
      entityId: id,
      beforeState: notice,
      afterState: updated,
      businessDate: req.businessDate
    });

    return res.json({
      success: true,
      message: `Notice ${notice.noticeNumber} updated to ${deliveryStatus || notice.deliveryStatus}.`,
      notice: updated
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update notice status.' });
  }
}

// 10. Get Collection Officers for Assignment Dropdown
export async function getCollectionOfficers(req: AuthenticatedRequest, res: Response) {
  try {
    const officers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          code: { in: ['COLLECTION_OFFICER', 'LOAN_OFFICER', 'BRANCH_MANAGER', 'SUPER_ADMIN'] }
        }
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: { select: { code: true, name: true } },
        branch: { select: { code: true, name: true } }
      },
      orderBy: { fullName: 'asc' }
    });

    return res.json({ success: true, count: officers.length, officers });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve collection officers.' });
  }
}
