import { Router } from 'express';
import {
  getLoanProducts,
  getLoanApplications,
  createLoanApplication,
  appraiseLoanApplication,
  sanctionLoanApplication,
  disburseLoan,
  getLoanAccounts,
  getLoanAccountById,
  repayLoanInstallment
} from './loans.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

// Products
router.get('/products', getLoanProducts);

// Applications (LOS)
router.get('/applications', getLoanApplications);
router.post(
  '/applications',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'MAKER'),
  createLoanApplication
);
router.post(
  '/applications/:id/appraise',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER'),
  appraiseLoanApplication
);
router.post(
  '/applications/:id/sanction',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'CHECKER'),
  sanctionLoanApplication
);
router.post(
  '/applications/:id/disburse',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'CHECKER'),
  disburseLoan
);

// Loan Accounts (Servicing)
router.get('/accounts', getLoanAccounts);
router.get('/accounts/:id', getLoanAccountById);
router.post(
  '/repay',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'TELLER', 'MAKER', 'COLLECTION_OFFICER'),
  repayLoanInstallment
);

export default router;
