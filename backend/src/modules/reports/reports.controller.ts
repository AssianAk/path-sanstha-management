import { Response } from 'express';
import { prisma } from '../../config/db';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';

// Helper to get GL balance map up to a given business date
async function getGLBalances(businessDate: string) {
  const accounts = await prisma.gLAccount.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' }
  });

  const lines = await prisma.transactionLine.findMany({
    where: { businessDate: { lte: businessDate } }
  });

  const totalsByCode: Record<string, { totalDebit: number; totalCredit: number }> = {};
  for (const line of lines) {
    if (!totalsByCode[line.glAccountCode]) {
      totalsByCode[line.glAccountCode] = { totalDebit: 0, totalCredit: 0 };
    }
    if (line.entryType === 'DEBIT') {
      totalsByCode[line.glAccountCode].totalDebit += line.amount;
    } else {
      totalsByCode[line.glAccountCode].totalCredit += line.amount;
    }
  }

  const map: Record<string, { account: any; netBalance: number; normalBalance: string }> = {};
  for (const a of accounts) {
    const stats = totalsByCode[a.code] || { totalDebit: 0, totalCredit: 0 };
    let net = 0;
    if (a.normalBalance === 'DEBIT') {
      net = stats.totalDebit - stats.totalCredit;
    } else {
      net = stats.totalCredit - stats.totalDebit;
    }
    map[a.code] = {
      account: a,
      netBalance: Math.round(net * 100) / 100,
      normalBalance: a.normalBalance
    };
  }

  return map;
}

// -------------------------------------------------------------
// 1. Form I Return (Statutory Liquidity Ratio - Section 24 BR Act AACS)
// -------------------------------------------------------------
export async function getFormIReturn(req: AuthenticatedRequest, res: Response) {
  try {
    const businessDate = req.businessDate || (req.query.asOfDate as string) || '2026-09-11';
    const glMap = await getGLBalances(businessDate);

    // 1. Demand Liabilities
    const currentDeposits = Math.max(0, glMap['GL-2002']?.netBalance || 0);
    const savingsDeposits = Math.max(0, glMap['GL-2001']?.netBalance || 0);
    const interestPayable = Math.max(0, glMap['GL-2005']?.netBalance || 0);
    const totalDemandLiabilities = Math.round((currentDeposits + savingsDeposits + interestPayable) * 100) / 100;

    // 2. Time Liabilities
    const fixedDeposits = Math.max(0, glMap['GL-2003']?.netBalance || 0);
    const recurringDeposits = Math.max(0, glMap['GL-2004']?.netBalance || 0);
    const totalTimeLiabilities = Math.round((fixedDeposits + recurringDeposits) * 100) / 100;

    // 3. Net Demand and Time Liabilities (NDTL)
    const totalNDTL = Math.round((totalDemandLiabilities + totalTimeLiabilities) * 100) / 100;

    // 4. Liquid Assets Maintained
    const cashInHand = Math.max(0, glMap['GL-1001']?.netBalance || 0);
    const balancesWithBanks = Math.max(0, glMap['GL-1002']?.netBalance || 0);
    const unencumberedSecurities = 0.00; // Can be expanded with treasury investments
    const totalLiquidAssets = Math.round((cashInHand + balancesWithBanks + unencumberedSecurities) * 100) / 100;

    // 5. Statutory Requirements & Compliance
    const prescribedSlrRatio = 25.00; // 25% statutory ratio for Co-operative Credit Societies / UCBs
    const minimumRequiredLiquidAssets = Math.round((totalNDTL * (prescribedSlrRatio / 100)) * 100) / 100;
    const actualSlrRatio = totalNDTL > 0 ? Math.round(((totalLiquidAssets / totalNDTL) * 100) * 100) / 100 : 100.00;
    const surplusDeficitAmount = Math.round((totalLiquidAssets - minimumRequiredLiquidAssets) * 100) / 100;
    const isCompliant = surplusDeficitAmount >= 0;

    const report = {
      institution: {
        name: 'Pune District Urban Co-operative Credit Society Ltd.',
        registrationNo: 'MSCS/CR/2012/PATSANSTHA-982',
        regulatoryReturn: 'Form I - Liquid Assets & SLR Compliance Return',
        statutoryProvision: 'Section 24 of Banking Regulation Act, 1949 (AACS) & MCS Act, 1960',
        businessDate
      },
      demandLiabilities: {
        currentDeposits,
        savingsDepositsDemandPortion: savingsDeposits,
        accruedInterestAndUnclaimedLiabilities: interestPayable,
        totalDemandLiabilities
      },
      timeLiabilities: {
        fixedTermDeposits: fixedDeposits,
        recurringDeposits,
        totalTimeLiabilities
      },
      ndtlSummary: {
        totalDemandLiabilities,
        totalTimeLiabilities,
        totalNDTL
      },
      liquidAssets: {
        cashInHandVaultsAndTills: cashInHand,
        balancesWithApexDistrictCentralCoopBanks: balancesWithBanks,
        unencumberedApprovedSecurities: unencumberedSecurities,
        totalLiquidAssets
      },
      slrCompliance: {
        prescribedSlrRatioPercent: prescribedSlrRatio,
        minimumRequiredLiquidAssets,
        actualLiquidAssetsMaintained: totalLiquidAssets,
        actualSlrRatioPercent: actualSlrRatio,
        surplusDeficitAmount,
        status: isCompliant ? 'COMPLIANT_SURPLUS' : 'DEFICIT_NON_COMPLIANT'
      }
    };

    return res.json({ success: true, report });
  } catch (err: any) {
    console.error('Error generating Form I:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate Form I SLR return.' });
  }
}

// -------------------------------------------------------------
// 2. Form IX Return (Statement of Position - Assets & Liabilities for RCS & RBI)
// -------------------------------------------------------------
export async function getFormIXReturn(req: AuthenticatedRequest, res: Response) {
  try {
    const businessDate = req.businessDate || (req.query.asOfDate as string) || '2026-09-11';
    const glMap = await getGLBalances(businessDate);

    // Compute Net P&L Surplus for Current Year
    const accounts = await prisma.gLAccount.findMany({ where: { isActive: true } });
    let totalIncome = 0;
    let totalExpenses = 0;
    for (const a of accounts) {
      const net = glMap[a.code]?.netBalance || 0;
      if (a.category === 'INCOME') totalIncome += net;
      if (a.category === 'EXPENSE') totalExpenses += net;
    }
    const currentYearSurplus = Math.round((totalIncome - totalExpenses) * 100) / 100;

    // Compute IRAC NPA provision held on loan portfolio
    const loans = await prisma.loanAccount.findMany({
      where: { status: { in: ['ACTIVE', 'DELINQUENT', 'NPA'] } }
    });
    const totalProvisionHeld = loans.reduce((acc, l) => acc + (l.provisionAmount || 0), 0);
    const roundedProvisionHeld = Math.round(totalProvisionHeld * 100) / 100;

    // Liabilities Schedules
    // Schedule I: Share Capital
    const memberShareCapital = Math.max(0, glMap['GL-3001']?.netBalance || 0);

    // Schedule II: Reserves & Surplus
    const statutoryReserve = Math.max(0, glMap['GL-3002']?.netBalance || 0);
    const educationFund = Math.max(0, glMap['GL-3003']?.netBalance || 0);
    const generalReserve = Math.max(0, glMap['GL-3004']?.netBalance || 0);
    const totalReserves = Math.round((statutoryReserve + educationFund + generalReserve) * 100) / 100;

    // Schedule III: Deposits
    const savingsDeposits = Math.max(0, glMap['GL-2001']?.netBalance || 0);
    const currentDeposits = Math.max(0, glMap['GL-2002']?.netBalance || 0);
    const fixedDeposits = Math.max(0, glMap['GL-2003']?.netBalance || 0);
    const recurringDeposits = Math.max(0, glMap['GL-2004']?.netBalance || 0);
    const totalDeposits = Math.round((savingsDeposits + currentDeposits + fixedDeposits + recurringDeposits) * 100) / 100;

    // Schedule IV: Other Liabilities & Provisions
    const interestAccruedPayable = Math.max(0, glMap['GL-2005']?.netBalance || 0);
    const otherLiabilities = interestAccruedPayable;

    // Schedule V: Profit & Loss Surplus
    const pnlSurplus = currentYearSurplus;

    const totalLiabilities = Math.round((memberShareCapital + totalReserves + totalDeposits + otherLiabilities + pnlSurplus) * 100) / 100;

    // Assets Schedules
    // Schedule I: Cash and Bank Balances
    const cashInHand = Math.max(0, glMap['GL-1001']?.netBalance || 0);
    const bankBalances = Math.max(0, glMap['GL-1002']?.netBalance || 0);
    const totalCashAndBank = Math.round((cashInHand + bankBalances) * 100) / 100;

    // Schedule II: Investments
    const investments = 0.00;

    // Schedule III: Loans and Advances
    const grossAdvances = Math.max(0, glMap['GL-1003']?.netBalance || 0);
    const netAdvances = Math.round((grossAdvances - roundedProvisionHeld) * 100) / 100;

    // Schedule IV: Fixed Assets
    const fixedAssets = Math.max(0, glMap['GL-1004']?.netBalance || 0);

    // Schedule V: Other Assets (e.g. IRAC provision offset or interest receivable)
    // In accounting, if provision is deducted from advances, provision offset or raw GL balance matches
    const totalAssets = Math.round((cashInHand + bankBalances + grossAdvances + fixedAssets) * 100) / 100;

    const difference = Math.abs(Math.round((totalAssets - totalLiabilities) * 100) / 100);
    const isBalanced = difference < 0.05;

    const report = {
      institution: {
        name: 'Pune District Urban Co-operative Credit Society Ltd.',
        registrationNo: 'MSCS/CR/2012/PATSANSTHA-982',
        regulatoryReturn: 'Form IX - Statement of Position (Assets and Liabilities)',
        statutoryProvision: 'Rule 62 of MCS Rules 1961 & Section 31 of Banking Regulation Act, 1949',
        businessDate
      },
      liabilities: {
        schedule1_ShareCapital: {
          title: 'Schedule I - Capital',
          authorizedShareCapital: 5000000.00,
          paidUpMemberCapital: memberShareCapital,
          total: memberShareCapital
        },
        schedule2_ReservesAndFunds: {
          title: 'Schedule II - Reserve Fund & Other Reserves',
          statutoryReserveFund: statutoryReserve,
          cooperativeEducationFund: educationFund,
          badDebtContingencyReserve: generalReserve,
          total: totalReserves
        },
        schedule3_DepositsAndOtherAccounts: {
          title: 'Schedule III - Deposits & Other Accounts',
          savingsBankDeposits: savingsDeposits,
          currentAccounts: currentDeposits,
          fixedDeposits: fixedDeposits,
          recurringDeposits: recurringDeposits,
          total: totalDeposits
        },
        schedule4_OtherLiabilities: {
          title: 'Schedule IV - Other Liabilities & Provisions',
          interestAccruedPayable: interestAccruedPayable,
          total: otherLiabilities
        },
        schedule5_ProfitAndLoss: {
          title: 'Schedule V - Profit & Loss Account',
          netOperatingSurplus: pnlSurplus,
          total: pnlSurplus
        },
        totalLiabilities
      },
      assets: {
        schedule1_CashAndBankBalances: {
          title: 'Schedule I - Cash in Hand & Balances with Banks',
          cashInHandAndVaults: cashInHand,
          balancesWithApexCentralBanks: bankBalances,
          total: totalCashAndBank
        },
        schedule2_Investments: {
          title: 'Schedule II - Investments & Securities',
          governmentAndTrusteeSecurities: investments,
          total: investments
        },
        schedule3_Advances: {
          title: 'Schedule III - Advances & Loan Portfolio',
          grossAdvancesPortfolio: grossAdvances,
          lessStatutoryProvisionForNPA: roundedProvisionHeld,
          netAdvancesPortfolio: netAdvances,
          total: grossAdvances
        },
        schedule4_FixedAssets: {
          title: 'Schedule IV - Premises, Furniture & Equipment',
          officeEquipmentAndFurniture: fixedAssets,
          total: fixedAssets
        },
        schedule5_OtherAssets: {
          title: 'Schedule V - Other Assets',
          interestReceivableAndSundry: 0.00,
          total: 0.00
        },
        totalAssets
      },
      equilibrium: {
        totalLiabilities,
        totalAssets,
        difference,
        isBalanced
      }
    };

    return res.json({ success: true, report });
  } catch (err: any) {
    console.error('Error generating Form IX:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate Form IX Statement of Position.' });
  }
}

// -------------------------------------------------------------
// 3. Member Passbook & Account Statement Engine
// -------------------------------------------------------------
export async function getMemberPassbook(req: AuthenticatedRequest, res: Response) {
  try {
    const { accountNumber } = req.params;
    const { fromDate, toDate } = req.query;

    const account = await prisma.account.findUnique({
      where: { accountNumber },
      include: {
        customer: {
          include: {
            addresses: true,
            nominees: true
          }
        },
        product: true,
        branch: true,
        termDepositDetail: true
      }
    });

    if (!account) {
      return res.status(404).json({ success: false, message: `Account '${accountNumber}' not found.` });
    }

    const businessDate = req.businessDate || '2026-09-11';
    const effectiveToDate = (toDate as string) || businessDate;
    const effectiveFromDate = (fromDate as string) || '2026-01-01';

    // Retrieve all transactions affecting this account
    // 1. Transactions with destinationAccountId == account.id (CREDIT into account)
    // 2. Transactions with sourceAccountId == account.id (DEBIT out of account)
    // 3. Any TransactionLine where accountId == account.id
    const lines = await prisma.transactionLine.findMany({
      where: {
        accountId: account.id
      },
      include: {
        transaction: {
          include: {
            makerUser: { select: { fullName: true } }
          }
        }
      },
      orderBy: [
        { businessDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Also check transactions where sourceAccountId or destinationAccountId is set but line might not have accountId directly
    const txns = await prisma.transaction.findMany({
      where: {
        OR: [
          { sourceAccountId: account.id },
          { destinationAccountId: account.id }
        ]
      },
      include: {
        makerUser: { select: { fullName: true } }
      },
      orderBy: [
        { businessDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Consolidate into unique events
    const eventMap = new Map<string, {
      reference: string;
      businessDate: string;
      createdAt: Date;
      narration: string;
      channel: string;
      maker: string;
      debit: number;
      credit: number;
    }>();

    // From lines
    for (const l of lines) {
      const ref = l.transaction.transactionReference;
      const isDebit = l.entryType === 'DEBIT';
      const existing = eventMap.get(ref) || {
        reference: ref,
        businessDate: l.businessDate,
        createdAt: l.createdAt,
        narration: l.transaction.narration,
        channel: l.transaction.channel,
        maker: l.transaction.makerUser?.fullName || 'System',
        debit: 0,
        credit: 0
      };

      if (isDebit) {
        existing.debit += l.amount;
      } else {
        existing.credit += l.amount;
      }
      eventMap.set(ref, existing);
    }

    // From transactions
    for (const t of txns) {
      if (!eventMap.has(t.transactionReference)) {
        const isDebit = t.sourceAccountId === account.id;
        eventMap.set(t.transactionReference, {
          reference: t.transactionReference,
          businessDate: t.businessDate,
          createdAt: t.createdAt,
          narration: t.narration,
          channel: t.channel,
          maker: t.makerUser?.fullName || 'System',
          debit: isDebit ? t.amount : 0,
          credit: !isDebit ? t.amount : 0
        });
      }
    }

    // Sort all events chronologically
    const allEvents = Array.from(eventMap.values()).sort((a, b) => {
      const cmpDate = a.businessDate.localeCompare(b.businessDate);
      if (cmpDate !== 0) return cmpDate;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Compute Opening Balance before effectiveFromDate
    let runningBalance = 0;
    for (const ev of allEvents) {
      if (ev.businessDate < effectiveFromDate) {
        runningBalance += (ev.credit - ev.debit);
      }
    }
    const openingBalance = Math.round(runningBalance * 100) / 100;

    // Filter events in the date window [effectiveFromDate, effectiveToDate]
    const statementEntries: any[] = [];
    let periodTotalDebit = 0;
    let periodTotalCredit = 0;

    for (const ev of allEvents) {
      if (ev.businessDate >= effectiveFromDate && ev.businessDate <= effectiveToDate) {
        runningBalance += (ev.credit - ev.debit);
        periodTotalDebit += ev.debit;
        periodTotalCredit += ev.credit;

        statementEntries.push({
          date: ev.businessDate,
          reference: ev.reference,
          narration: ev.narration,
          channel: ev.channel,
          maker: ev.maker,
          debit: Math.round(ev.debit * 100) / 100,
          credit: Math.round(ev.credit * 100) / 100,
          runningBalance: Math.round(runningBalance * 100) / 100
        });
      }
    }

    const closingBalance = Math.round(runningBalance * 100) / 100;

    return res.json({
      success: true,
      passbook: {
        institution: {
          name: 'Pune District Urban Co-operative Credit Society Ltd.',
          branch: account.branch.name,
          branchCode: account.branch.code,
          ifsc: account.branch.ifscCode || 'PATS0001001',
          phone: account.branch.phone
        },
        accountDetails: {
          accountNumber: account.accountNumber,
          accountType: account.product.name,
          productCode: account.product.code,
          currency: account.currency,
          status: account.status,
          currentLedgerBalance: account.ledgerBalance,
          availableBalance: account.availableBalance,
          lienAmount: account.lienAmount,
          openedDate: account.openedDate.toISOString().split('T')[0]
        },
        memberDetails: {
          customerNumber: account.customer.customerNumber,
          isMember: account.customer.isMember,
          memberNumber: account.customer.memberNumber || 'N/A',
          fullName: `${account.customer.title} ${account.customer.firstName} ${account.customer.lastName}`,
          phone: account.customer.phone,
          pan: account.customer.pan || 'N/A',
          kycStatus: account.customer.status,
          address: account.customer.addresses[0] ? `${account.customer.addresses[0].line1}, ${account.customer.addresses[0].city} ${account.customer.addresses[0].pincode}` : 'N/A',
          nominee: account.customer.nominees[0] ? `${account.customer.nominees[0].name} (${account.customer.nominees[0].relationship})` : (account.nomineeName ? `${account.nomineeName} (${account.nomineeRelation || 'Nominee'})` : 'N/A')
        },
        period: {
          fromDate: effectiveFromDate,
          toDate: effectiveToDate
        },
        openingBalance,
        entries: statementEntries,
        closingBalance,
        summary: {
          totalDebits: Math.round(periodTotalDebit * 100) / 100,
          totalCredits: Math.round(periodTotalCredit * 100) / 100,
          transactionCount: statementEntries.length
        }
      }
    });
  } catch (err: any) {
    console.error('Error generating member passbook:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate member passbook statement.' });
  }
}

// -------------------------------------------------------------
// 4. Managerial MIS Analytics Dashboard
// -------------------------------------------------------------
export async function getManagerialMIS(req: AuthenticatedRequest, res: Response) {
  try {
    const businessDate = req.businessDate || (req.query.asOfDate as string) || '2026-09-11';
    const glMap = await getGLBalances(businessDate);

    // 1. Deposits Breakdown
    const savingsAmount = Math.max(0, glMap['GL-2001']?.netBalance || 0);
    const currentAmount = Math.max(0, glMap['GL-2002']?.netBalance || 0);
    const fdAmount = Math.max(0, glMap['GL-2003']?.netBalance || 0);
    const rdAmount = Math.max(0, glMap['GL-2004']?.netBalance || 0);

    const totalDemandDeposits = Math.round((savingsAmount + currentAmount) * 100) / 100;
    const totalTermDeposits = Math.round((fdAmount + rdAmount) * 100) / 100;
    const totalDeposits = Math.round((totalDemandDeposits + totalTermDeposits) * 100) / 100;

    // Counts of deposit accounts
    const accountCounts = await prisma.account.groupBy({
      by: ['productId'],
      _count: { id: true }
    });
    const products = await prisma.product.findMany();
    const productCountMap = Object.fromEntries(products.map(p => [p.id, { code: p.code, name: p.name, category: p.category }]));

    const depositMix = [
      { category: 'SAVINGS', name: 'Savings Accounts (SB)', amount: savingsAmount, count: 0 },
      { category: 'CURRENT', name: 'Current Accounts (CA)', amount: currentAmount, count: 0 },
      { category: 'FD', name: 'Fixed Term Deposits (FD)', amount: fdAmount, count: 0 },
      { category: 'RD', name: 'Recurring Deposits (RD)', amount: rdAmount, count: 0 }
    ];

    for (const c of accountCounts) {
      const p = productCountMap[c.productId];
      if (p) {
        const item = depositMix.find(d => d.category === p.category);
        if (item) item.count += c._count.id;
      }
    }

    const casaRatio = totalDeposits > 0 ? Math.round(((totalDemandDeposits / totalDeposits) * 100) * 100) / 100 : 0;

    // 2. Advances & Loan Portfolio Breakdown
    const loans = await prisma.loanAccount.findMany({
      include: {
        loanProduct: true,
        loanApplication: true,
        branch: true
      }
    });

    let totalAdvancesOutstanding = 0;
    let grossNpaAmount = 0;
    let totalProvisionHeld = 0;
    let standardAdvances = 0;

    const productBreakdown: Record<string, { code: string; name: string; amount: number; count: number }> = {};
    const riskBreakdown: Record<string, { grade: string; amount: number; count: number }> = {
      LOW: { grade: 'LOW', amount: 0, count: 0 },
      MEDIUM: { grade: 'MEDIUM', amount: 0, count: 0 },
      HIGH: { grade: 'HIGH', amount: 0, count: 0 }
    };
    const assetClassificationBreakdown: Record<string, { classification: string; amount: number; count: number }> = {
      STANDARD: { classification: 'STANDARD (0 DPD)', amount: 0, count: 0 },
      SMA_0: { classification: 'SMA-0 (1-30 DPD)', amount: 0, count: 0 },
      SMA_1: { classification: 'SMA-1 (31-60 DPD)', amount: 0, count: 0 },
      SMA_2: { classification: 'SMA-2 (61-90 DPD)', amount: 0, count: 0 },
      SUB_STANDARD: { classification: 'Sub-Standard (91-455 DPD)', amount: 0, count: 0 },
      DOUBTFUL: { classification: 'Doubtful Asset (>455 DPD)', amount: 0, count: 0 },
      LOSS: { classification: 'Loss Asset (Uncollectible)', amount: 0, count: 0 }
    };

    for (const l of loans) {
      const bal = l.principalOutstanding;
      totalAdvancesOutstanding += bal;
      totalProvisionHeld += (l.provisionAmount || 0);

      const pCode = l.loanProduct.code;
      if (!productBreakdown[pCode]) {
        productBreakdown[pCode] = { code: pCode, name: l.loanProduct.name, amount: 0, count: 0 };
      }
      productBreakdown[pCode].amount += bal;
      productBreakdown[pCode].count += 1;

      const risk = l.loanApplication?.riskGrade || 'LOW';
      if (riskBreakdown[risk]) {
        riskBreakdown[risk].amount += bal;
        riskBreakdown[risk].count += 1;
      }

      const c = l.assetClassification || 'STANDARD';
      if (assetClassificationBreakdown[c]) {
        assetClassificationBreakdown[c].amount += bal;
        assetClassificationBreakdown[c].count += 1;
      }

      if (['SUB_STANDARD', 'DOUBTFUL', 'LOSS'].includes(c)) {
        grossNpaAmount += bal;
      } else {
        standardAdvances += bal;
      }
    }

    totalAdvancesOutstanding = Math.round(totalAdvancesOutstanding * 100) / 100;
    grossNpaAmount = Math.round(grossNpaAmount * 100) / 100;
    totalProvisionHeld = Math.round(totalProvisionHeld * 100) / 100;
    standardAdvances = Math.round(standardAdvances * 100) / 100;

    const cdRatio = totalDeposits > 0 ? Math.round(((totalAdvancesOutstanding / totalDeposits) * 100) * 100) / 100 : 0;
    const grossNpaRatio = totalAdvancesOutstanding > 0 ? Math.round(((grossNpaAmount / totalAdvancesOutstanding) * 100) * 100) / 100 : 0;
    const pcrRatio = grossNpaAmount > 0 ? Math.round(((totalProvisionHeld / grossNpaAmount) * 100) * 100) / 100 : 100.00;
    const netNpaAmount = Math.max(0, Math.round((grossNpaAmount - totalProvisionHeld) * 100) / 100);
    const netAdvances = Math.round((totalAdvancesOutstanding - totalProvisionHeld) * 100) / 100;
    const netNpaRatio = netAdvances > 0 ? Math.round(((netNpaAmount / netAdvances) * 100) * 100) / 100 : 0;

    // 3. Customer & Member Counts
    const totalMembers = await prisma.customer.count({ where: { isMember: true } });
    const totalCustomers = await prisma.customer.count();

    // 4. Branch Summary
    const branches = await prisma.branch.findMany({
      include: {
        accounts: true,
        loanAccounts: true
      }
    });

    const branchMetrics = branches.map(b => {
      const dep = b.accounts.reduce((sum, a) => sum + a.ledgerBalance, 0);
      const adv = b.loanAccounts.reduce((sum, l) => sum + l.principalOutstanding, 0);
      return {
        branchCode: b.code,
        branchName: b.name,
        totalDeposits: Math.round(dep * 100) / 100,
        totalAdvances: Math.round(adv * 100) / 100,
        accountCount: b.accounts.length,
        loanCount: b.loanAccounts.length
      };
    });

    return res.json({
      success: true,
      businessDate,
      kpis: {
        totalDeposits,
        totalAdvances: totalAdvancesOutstanding,
        cdRatio,
        casaRatio,
        grossNpaAmount,
        grossNpaRatio,
        provisionsHeld: totalProvisionHeld,
        pcrRatio,
        netNpaAmount,
        netNpaRatio,
        totalMembers,
        totalCustomers
      },
      depositMix: depositMix.map(d => ({ ...d, amount: Math.round(d.amount * 100) / 100 })),
      loanProductBreakdown: Object.values(productBreakdown).map(p => ({ ...p, amount: Math.round(p.amount * 100) / 100 })),
      loanRiskBreakdown: Object.values(riskBreakdown).map(r => ({ ...r, amount: Math.round(r.amount * 100) / 100 })),
      assetClassificationBreakdown: Object.values(assetClassificationBreakdown).map(a => ({ ...a, amount: Math.round(a.amount * 100) / 100 })),
      branchMetrics
    });
  } catch (err: any) {
    console.error('Error generating Managerial MIS:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate Managerial MIS analytics.' });
  }
}

// -------------------------------------------------------------
// 5. CSV Export Engine
// -------------------------------------------------------------
export async function exportReportCsv(req: AuthenticatedRequest, res: Response) {
  try {
    const { reportType } = req.params;
    const businessDate = req.businessDate || '2026-09-11';

    let csvContent = '';
    let fileName = `report_${reportType}_${businessDate}.csv`;

    if (reportType === 'form-i') {
      fileName = `Form_I_SLR_Return_${businessDate}.csv`;
      const glMap = await getGLBalances(businessDate);
      const current = Math.max(0, glMap['GL-2002']?.netBalance || 0);
      const savings = Math.max(0, glMap['GL-2001']?.netBalance || 0);
      const fd = Math.max(0, glMap['GL-2003']?.netBalance || 0);
      const rd = Math.max(0, glMap['GL-2004']?.netBalance || 0);
      const cash = Math.max(0, glMap['GL-1001']?.netBalance || 0);
      const bank = Math.max(0, glMap['GL-1002']?.netBalance || 0);
      const totalNdtl = current + savings + fd + rd;
      const totalLiquid = cash + bank;
      const minRequired = totalNdtl * 0.25;
      const surplus = totalLiquid - minRequired;

      csvContent = [
        'Form I - Statutory Liquidity Ratio (SLR) Return',
        `Pune District Urban Co-operative Credit Society Ltd. | As of ${businessDate}`,
        'Section,Line Item,Amount (INR)',
        `Demand Liabilities,Current Accounts,${current.toFixed(2)}`,
        `Demand Liabilities,Savings Bank Deposits,${savings.toFixed(2)}`,
        `Time Liabilities,Fixed Term Deposits,${fd.toFixed(2)}`,
        `Time Liabilities,Recurring Deposits,${rd.toFixed(2)}`,
        `NDTL Summary,Total Net Demand and Time Liabilities,${totalNdtl.toFixed(2)}`,
        `Liquid Assets,Cash in Hand (Vaults & Tills),${cash.toFixed(2)}`,
        `Liquid Assets,Balances with Apex & Central Co-op Banks,${bank.toFixed(2)}`,
        `Liquid Assets,Total Liquid Assets Maintained,${totalLiquid.toFixed(2)}`,
        `SLR Compliance,Prescribed SLR Requirement (25%),${minRequired.toFixed(2)}`,
        `SLR Compliance,Surplus / Deficit Position,${surplus.toFixed(2)}`,
        `SLR Compliance,Compliance Status,${surplus >= 0 ? 'COMPLIANT (SURPLUS)' : 'DEFICIT (NON-COMPLIANT)'}`
      ].join('\n');
    } else if (reportType === 'form-ix') {
      fileName = `Form_IX_Statement_Of_Position_${businessDate}.csv`;
      const glMap = await getGLBalances(businessDate);
      csvContent = [
        'Form IX - Statement of Position (Assets and Liabilities)',
        `Pune District Urban Co-operative Credit Society Ltd. | As of ${businessDate}`,
        'Side,Schedule,Classification,GL Code,Amount (INR)',
        `Liabilities,Schedule I,Paid-up Share Capital,GL-3001,${(glMap['GL-3001']?.netBalance || 0).toFixed(2)}`,
        `Liabilities,Schedule II,Statutory Reserve Fund,GL-3002,${(glMap['GL-3002']?.netBalance || 0).toFixed(2)}`,
        `Liabilities,Schedule II,Co-op Education Fund,GL-3003,${(glMap['GL-3003']?.netBalance || 0).toFixed(2)}`,
        `Liabilities,Schedule III,Savings Deposits,GL-2001,${(glMap['GL-2001']?.netBalance || 0).toFixed(2)}`,
        `Liabilities,Schedule III,Current Deposits,GL-2002,${(glMap['GL-2002']?.netBalance || 0).toFixed(2)}`,
        `Liabilities,Schedule III,Fixed Term Deposits,GL-2003,${(glMap['GL-2003']?.netBalance || 0).toFixed(2)}`,
        `Liabilities,Schedule III,Recurring Deposits,GL-2004,${(glMap['GL-2004']?.netBalance || 0).toFixed(2)}`,
        `Assets,Schedule I,Cash in Hand,GL-1001,${(glMap['GL-1001']?.netBalance || 0).toFixed(2)}`,
        `Assets,Schedule I,Bank Balances with Apex,GL-1002,${(glMap['GL-1002']?.netBalance || 0).toFixed(2)}`,
        `Assets,Schedule III,Loan Advances Portfolio,GL-1003,${(glMap['GL-1003']?.netBalance || 0).toFixed(2)}`,
        `Assets,Schedule IV,Fixed Assets & Furniture,GL-1004,${(glMap['GL-1004']?.netBalance || 0).toFixed(2)}`
      ].join('\n');
    } else {
      csvContent = `Report Type: ${reportType}\nGenerated On: ${businessDate}\nStatus: Completed`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(csvContent);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to export CSV.' });
  }
}
