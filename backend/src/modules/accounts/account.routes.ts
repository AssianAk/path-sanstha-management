import { Router } from 'express';
import { getAccounts, getAccountById, openAccount } from './account.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', getAccounts);
router.get('/:id', getAccountById);
router.post(
  '/open',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'MAKER'),
  openAccount
);

export default router;
