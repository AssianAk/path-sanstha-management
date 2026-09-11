import { Router } from 'express';
import {
  getActiveTill,
  openTill,
  processCashDeposit,
  processCashWithdrawal,
  balanceTill
} from './teller.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/till/active', getActiveTill);
router.post(
  '/till/open',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'TELLER', 'MAKER'),
  openTill
);
router.post(
  '/deposit',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'TELLER', 'MAKER'),
  processCashDeposit
);
router.post(
  '/withdraw',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'TELLER', 'MAKER'),
  processCashWithdrawal
);
router.post(
  '/till/balance',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'TELLER', 'MAKER'),
  balanceTill
);

export default router;
