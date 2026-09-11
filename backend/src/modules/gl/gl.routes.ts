import { Router } from 'express';
import {
  getChartOfAccounts,
  postJournalVoucher,
  getGeneralLedgerLines,
  getTrialBalance,
  getProfitAndLoss,
  getBalanceSheet
} from './gl.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

// 1. Chart of Accounts (COA) Directory
router.get('/accounts', getChartOfAccounts);

// 2. Manual Double-Entry Journal Voucher Entry
router.post(
  '/vouchers',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'ACCOUNTANT'),
  postJournalVoucher
);

// 3. General Ledger Journal Lines
router.get('/ledger-lines', getGeneralLedgerLines);

// 4. Trial Balance Engine
router.get('/trial-balance', getTrialBalance);

// 5. Statutory Financial Statements
router.get('/profit-and-loss', getProfitAndLoss);
router.get('/balance-sheet', getBalanceSheet);

export default router;
