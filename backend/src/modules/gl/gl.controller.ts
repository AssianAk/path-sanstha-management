import { Response } from 'express';
import { prisma } from '../../config/db';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';

// 1. Get Chart of Accounts (COA) Directory with Live Balances
export async function getChartOfAccounts(req: AuthenticatedRequest, res: Response) {
  try {
    const { category } = req.query;
    const where: any = { isActive: true };
    if (category) where.category = String(category);

    const accounts = await prisma.gLAccount.findMany({
      where,
      orderBy: { code: 'asc' }
    });

    // Compute live debit/credit aggregates from posted transaction lines
    const journalLines = await prisma.transactionLine.findMany();
    const balanceMap: Record<string, { totalDebit: number; totalCredit: number }> = {};

    for (const line of journalLines) {
      if (!balanceMap[line.glAccountCode]) {
        balanceMap[line.glAccountCode] = { totalDebit: 0, totalCredit: 0 };
      }
      if (line.entryType === 'DEBIT') {
        balanceMap[line.glAccountCode].totalDebit += line.amount;
      } else {
        balanceMap[line.glAccountCode].totalCredit += line.amount;
      }
    }

    const result = accounts.map(a => {
      const stats = balanceMap[a.code] || { totalDebit: 0, totalCredit: 0 };
      let netBalance = 0;
      if (a.normalBalance === 'DEBIT') {
        netBalance = stats.totalDebit - stats.totalCredit;
      } else {
        netBalance = stats.totalCredit - stats.totalDebit;
      }

      return {
        ...a,
        totalDebit: Math.round(stats.totalDebit * 100) / 100,
        totalCredit: Math.round(stats.totalCredit * 100) / 100,
        netBalance: Math.round(netBalance * 100) / 100
      };
    });

    return res.json({ success: true, count: result.length, accounts: result });
  } catch (err: any) {
    console.error('Error fetching COA:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve Chart of Accounts.' });
  }
}

// 2. Post Manual Journal Voucher (Double-Entry Invariant: Debits == Credits)
export async function postJournalVoucher(req: AuthenticatedRequest, res: Response) {
  try {
    const { narration, entries = [], branchId } = req.body;

    if (!narration || !entries || entries.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A journal voucher must include a narration and at least 2 entry legs.'
      });
    }

    const businessDate = req.businessDate || '2026-09-11';
    const targetBranchId = branchId || req.user?.branchId || 'b1';

    let totalDebits = 0;
    let totalCredits = 0;

    const validatedLines: any[] = [];

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const parsedAmount = Math.round(Number(e.amount) * 100) / 100;

      if (!e.glAccountCode || !e.entryType || isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid line item #${i + 1}. Valid GL Account, entry type (DEBIT/CREDIT), and positive amount required.`
        });
      }

      const glAccount = await prisma.gLAccount.findUnique({
        where: { code: e.glAccountCode }
      });

      if (!glAccount) {
        return res.status(404).json({
          success: false,
          message: `GL Account code '${e.glAccountCode}' does not exist in Chart of Accounts.`
        });
      }

      if (e.entryType === 'DEBIT') {
        totalDebits += parsedAmount;
      } else if (e.entryType === 'CREDIT') {
        totalCredits += parsedAmount;
      } else {
        return res.status(400).json({
          success: false,
          message: `Entry type must be DEBIT or CREDIT (received '${e.entryType}' at line #${i + 1}).`
        });
      }

      validatedLines.push({
        glAccountCode: glAccount.code,
        glAccountName: glAccount.name,
        entryType: e.entryType,
        amount: parsedAmount,
        businessDate
      });
    }

    totalDebits = Math.round(totalDebits * 100) / 100;
    totalCredits = Math.round(totalCredits * 100) / 100;
    const difference = Math.abs(Math.round((totalDebits - totalCredits) * 100) / 100);

    if (difference > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Double-entry invariant violated! Total debits (₹${totalDebits.toLocaleString()}) must exactly equal total credits (₹${totalCredits.toLocaleString()}). Difference: ₹${difference.toLocaleString()}.`
      });
    }

    // Atomic transaction creation
    const txResult = await prisma.$transaction(async (tx) => {
      const txCount = await tx.transaction.count();
      const txSeq = String(txCount + 1).padStart(5, '0');
      const txDateCompact = businessDate.replace(/-/g, '');
      const transactionReference = `TXN-${txDateCompact}-${txSeq}`;

      const newTxn = await tx.transaction.create({
        data: {
          transactionReference,
          transactionType: 'JOURNAL_VOUCHER',
          channel: 'MANUAL_JOURNAL',
          branchId: targetBranchId,
          businessDate,
          amount: totalDebits,
          currency: 'INR',
          narration: narration.trim(),
          status: 'POSTED',
          makerUserId: req.user?.id!,
          journalLines: {
            create: validatedLines
          }
        },
        include: {
          journalLines: true
        }
      });

      return newTxn;
    });

    await createAuditLog(req, {
      action: 'CREATE',
      entityName: 'JOURNAL_VOUCHER',
      entityId: txResult.id,
      afterState: {
        reference: txResult.transactionReference,
        narration: txResult.narration,
        totalAmount: totalDebits,
        linesCount: validatedLines.length
      },
      businessDate
    });

    return res.status(201).json({
      success: true,
      message: `Journal Voucher ${txResult.transactionReference} posted successfully with balanced debits and credits of ₹${totalDebits.toLocaleString()}.`,
      transaction: txResult
    });
  } catch (err: any) {
    console.error('Error posting journal voucher:', err);
    return res.status(500).json({ success: false, message: 'Failed to post journal voucher.' });
  }
}

// 3. Get General Ledger Journal Lines (Day Book / Audit of Lines)
export async function getGeneralLedgerLines(req: AuthenticatedRequest, res: Response) {
  try {
    const { glAccountCode, branchId, fromDate, toDate } = req.query;
    const where: any = {};

    if (glAccountCode) where.glAccountCode = String(glAccountCode);
    if (fromDate || toDate) {
      where.businessDate = {};
      if (fromDate) where.businessDate.gte = String(fromDate);
      if (toDate) where.businessDate.lte = String(toDate);
    }

    const lines = await prisma.transactionLine.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        transaction: {
          select: {
            transactionReference: true,
            transactionType: true,
            channel: true,
            narration: true,
            businessDate: true,
            makerUser: { select: { fullName: true } },
            branch: { select: { code: true, name: true } }
          }
        }
      }
    });

    return res.json({ success: true, count: lines.length, lines });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve ledger entries.' });
  }
}

// 4. Automated Daily Trial Balance Engine
export async function getTrialBalance(req: AuthenticatedRequest, res: Response) {
  try {
    const businessDate = req.businessDate || '2026-09-11';
    const accounts = await prisma.gLAccount.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    });

    const lines = await prisma.transactionLine.findMany({
      where: {
        businessDate: { lte: businessDate }
      }
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

    let grandTotalGrossDebits = 0;
    let grandTotalGrossCredits = 0;
    let grandTotalNetDebits = 0;
    let grandTotalNetCredits = 0;

    const trialBalanceRows = accounts.map(a => {
      const stats = totalsByCode[a.code] || { totalDebit: 0, totalCredit: 0 };
      grandTotalGrossDebits += stats.totalDebit;
      grandTotalGrossCredits += stats.totalCredit;

      let netDebit = 0;
      let netCredit = 0;

      if (a.normalBalance === 'DEBIT') {
        if (stats.totalDebit >= stats.totalCredit) {
          netDebit = stats.totalDebit - stats.totalCredit;
        } else {
          netCredit = stats.totalCredit - stats.totalDebit;
        }
      } else {
        if (stats.totalCredit >= stats.totalDebit) {
          netCredit = stats.totalCredit - stats.totalDebit;
        } else {
          netDebit = stats.totalDebit - stats.totalCredit;
        }
      }

      grandTotalNetDebits += netDebit;
      grandTotalNetCredits += netCredit;

      return {
        glAccountCode: a.code,
        glAccountName: a.name,
        category: a.category,
        normalBalance: a.normalBalance,
        totalDebit: Math.round(stats.totalDebit * 100) / 100,
        totalCredit: Math.round(stats.totalCredit * 100) / 100,
        netDebit: Math.round(netDebit * 100) / 100,
        netCredit: Math.round(netCredit * 100) / 100
      };
    });

    grandTotalGrossDebits = Math.round(grandTotalGrossDebits * 100) / 100;
    grandTotalGrossCredits = Math.round(grandTotalGrossCredits * 100) / 100;
    grandTotalNetDebits = Math.round(grandTotalNetDebits * 100) / 100;
    grandTotalNetCredits = Math.round(grandTotalNetCredits * 100) / 100;

    const isBalanced = Math.abs(grandTotalNetDebits - grandTotalNetCredits) < 0.05;

    return res.json({
      success: true,
      businessDate,
      trialBalance: trialBalanceRows,
      summary: {
        grandTotalGrossDebits,
        grandTotalGrossCredits,
        grandTotalNetDebits,
        grandTotalNetCredits,
        difference: Math.round(Math.abs(grandTotalNetDebits - grandTotalNetCredits) * 100) / 100,
        isBalanced
      }
    });
  } catch (err: any) {
    console.error('Error generating trial balance:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate trial balance.' });
  }
}

// 5. Profit & Loss Statement (Income Statement) & Statutory Allocations
export async function getProfitAndLoss(req: AuthenticatedRequest, res: Response) {
  try {
    const businessDate = req.businessDate || '2026-09-11';
    
    const accounts = await prisma.gLAccount.findMany({
      where: {
        category: { in: ['INCOME', 'EXPENSE'] },
        isActive: true
      },
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

    const incomeRows: any[] = [];
    const expenseRows: any[] = [];
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const a of accounts) {
      const stats = totalsByCode[a.code] || { totalDebit: 0, totalCredit: 0 };

      if (a.category === 'INCOME') {
        const netIncome = stats.totalCredit - stats.totalDebit;
        totalIncome += netIncome;
        incomeRows.push({
          code: a.code,
          name: a.name,
          amount: Math.round(netIncome * 100) / 100
        });
      } else if (a.category === 'EXPENSE') {
        const netExpense = stats.totalDebit - stats.totalCredit;
        totalExpenses += netExpense;
        expenseRows.push({
          code: a.code,
          name: a.name,
          amount: Math.round(netExpense * 100) / 100
        });
      }
    }

    totalIncome = Math.round(totalIncome * 100) / 100;
    totalExpenses = Math.round(totalExpenses * 100) / 100;
    const netSurplus = Math.round((totalIncome - totalExpenses) * 100) / 100;

    // Statutory Allocations under State Co-operative Societies Act
    const statutoryReserve = netSurplus > 0 ? Math.round(netSurplus * 0.25 * 100) / 100 : 0; // 25% Statutory Reserve
    const educationFund = netSurplus > 0 ? Math.round(netSurplus * 0.01 * 100) / 100 : 0; // 1% Co-op Education Fund
    const dividendEqualization = netSurplus > 0 ? Math.round(netSurplus * 0.10 * 100) / 100 : 0; // 10% Dividend Equalization
    const unallocatedSurplus = netSurplus > 0 ? Math.round((netSurplus - statutoryReserve - educationFund - dividendEqualization) * 100) / 100 : 0;

    return res.json({
      success: true,
      businessDate,
      incomeRows,
      expenseRows,
      totalIncome,
      totalExpenses,
      netSurplus,
      isProfitable: netSurplus >= 0,
      statutoryAllocations: {
        statutoryReserve,
        educationFund,
        dividendEqualization,
        unallocatedSurplus
      }
    });
  } catch (err: any) {
    console.error('Error generating Profit & Loss:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate Profit & Loss statement.' });
  }
}

// 6. Balance Sheet Statement (Assets == Liabilities + Equity)
export async function getBalanceSheet(req: AuthenticatedRequest, res: Response) {
  try {
    const businessDate = req.businessDate || '2026-09-11';

    const accounts = await prisma.gLAccount.findMany({
      where: {
        category: { in: ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'] },
        isActive: true
      },
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

    // Compute Net P&L Surplus for Current Year
    let totalIncome = 0;
    let totalExpenses = 0;
    for (const a of accounts) {
      const stats = totalsByCode[a.code] || { totalDebit: 0, totalCredit: 0 };
      if (a.category === 'INCOME') totalIncome += (stats.totalCredit - stats.totalDebit);
      if (a.category === 'EXPENSE') totalExpenses += (stats.totalDebit - stats.totalCredit);
    }
    const currentYearSurplus = Math.round((totalIncome - totalExpenses) * 100) / 100;

    // Assets breakdown
    const assetRows: any[] = [];
    let totalAssets = 0;

    // Liabilities breakdown
    const liabilityRows: any[] = [];
    let totalLiabilities = 0;

    // Equity breakdown
    const equityRows: any[] = [];
    let totalEquity = 0;

    for (const a of accounts) {
      const stats = totalsByCode[a.code] || { totalDebit: 0, totalCredit: 0 };

      if (a.category === 'ASSET') {
        const netAsset = stats.totalDebit - stats.totalCredit;
        totalAssets += netAsset;
        assetRows.push({
          code: a.code,
          name: a.name,
          amount: Math.round(netAsset * 100) / 100
        });
      } else if (a.category === 'LIABILITY') {
        const netLiab = stats.totalCredit - stats.totalDebit;
        totalLiabilities += netLiab;
        liabilityRows.push({
          code: a.code,
          name: a.name,
          amount: Math.round(netLiab * 100) / 100
        });
      } else if (a.category === 'EQUITY') {
        const netEq = stats.totalCredit - stats.totalDebit;
        totalEquity += netEq;
        equityRows.push({
          code: a.code,
          name: a.name,
          amount: Math.round(netEq * 100) / 100
        });
      }
    }

    // Include P&L Current Year Surplus under Equity & Reserves
    totalEquity += currentYearSurplus;
    equityRows.push({
      code: 'PL-SURPLUS',
      name: 'Current Year Net Profit / Operating Surplus (from P&L)',
      amount: currentYearSurplus
    });

    totalAssets = Math.round(totalAssets * 100) / 100;
    totalLiabilities = Math.round(totalLiabilities * 100) / 100;
    totalEquity = Math.round(totalEquity * 100) / 100;
    const totalLiabilitiesAndEquity = Math.round((totalLiabilities + totalEquity) * 100) / 100;

    const difference = Math.abs(Math.round((totalAssets - totalLiabilitiesAndEquity) * 100) / 100);
    const isBalanced = difference < 0.05;

    return res.json({
      success: true,
      businessDate,
      assets: {
        rows: assetRows,
        totalAssets
      },
      liabilitiesAndEquity: {
        liabilityRows,
        equityRows,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesAndEquity
      },
      summary: {
        totalAssets,
        totalLiabilitiesAndEquity,
        difference,
        isBalanced
      }
    });
  } catch (err: any) {
    console.error('Error generating Balance Sheet:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate Balance Sheet.' });
  }
}
