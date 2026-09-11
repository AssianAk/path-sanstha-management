import { Router } from 'express';
import { getApprovalQueue, uploadKycDocument, processApprovalAction } from './kyc.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

// View queue - all bank staff can see status
router.get('/queue', getApprovalQueue);

// Maker uploads document & creates approval item
router.post(
  '/upload-doc',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'MAKER'),
  uploadKycDocument
);

// Checker takes action (APPROVE, REJECT, SEND_BACK)
router.post(
  '/action',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'CHECKER'),
  processApprovalAction
);

export default router;
