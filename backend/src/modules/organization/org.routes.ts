import { Router } from 'express';
import { getBranches, createBranch, updateBusinessDate, getOrganizationDetails } from './org.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/details', getOrganizationDetails);
router.get('/branches', getBranches);
router.post('/branches', authorizeRoles('SUPER_ADMIN', 'HO_ADMIN'), createBranch);
router.post('/business-date/update', authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER'), updateBusinessDate);

export default router;
