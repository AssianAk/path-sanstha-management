import { Router } from 'express';
import { getAuditLogs } from './audit.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

// Auditor, Super Admin, HO Admin, Branch Manager can inspect logs
router.get(
  '/',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'AUDITOR'),
  getAuditLogs
);

export default router;
