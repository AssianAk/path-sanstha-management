import { Router } from 'express';
import { processInternalTransfer, validateBeneficiaryAccount } from './transfer.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/validate/:accountNumber', validateBeneficiaryAccount);
router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'TELLER', 'MAKER'),
  processInternalTransfer
);

export default router;
