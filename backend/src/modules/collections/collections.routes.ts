import { Router } from 'express';
import {
  runEodClassification,
  getCollectionsDashboard,
  getDelinquentAccounts,
  assignCollector,
  logRecoveryAction,
  getRecoveryActions,
  generateNotice,
  getNotices,
  updateNoticeStatus,
  getCollectionOfficers
} from './collections.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

// 1. Dashboard & Batch Run
router.get('/dashboard', getCollectionsDashboard);
router.post(
  '/run-eod-classification',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'ACCOUNTANT'),
  runEodClassification
);

// 2. Delinquency Worklist & Assignment
router.get('/delinquent-accounts', getDelinquentAccounts);
router.post(
  '/assign-collector',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER'),
  assignCollector
);
router.get('/officers', getCollectionOfficers);

// 3. Field Recovery Interaction Logs
router.post(
  '/recovery-actions',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'COLLECTION_OFFICER'),
  logRecoveryAction
);
router.get('/recovery-actions/:loanAccountId', getRecoveryActions);

// 4. Legal / Demand Notices
router.post(
  '/notices/generate',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'COLLECTION_OFFICER', 'CHECKER'),
  generateNotice
);
router.get('/notices', getNotices);
router.patch(
  '/notices/:id/status',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'COLLECTION_OFFICER', 'MAKER'),
  updateNoticeStatus
);

export default router;
