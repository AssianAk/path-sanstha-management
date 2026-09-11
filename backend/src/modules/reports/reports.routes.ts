import { Router } from 'express';
import {
  getFormIReturn,
  getFormIXReturn,
  getMemberPassbook,
  getManagerialMIS,
  exportReportCsv
} from './reports.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

// 1. Regulatory Statutory Returns (Staff/Audit only)
router.get('/form-i', authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'ACCOUNTANT', 'AUDITOR'), getFormIReturn);
router.get('/form-ix', authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'ACCOUNTANT', 'AUDITOR'), getFormIXReturn);

// 2. Member Passbook & Account Statement
router.get('/passbook/:accountNumber', getMemberPassbook);

// 3. Managerial MIS Executive Analytics (Staff/Audit only)
router.get('/managerial-mis', authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'ACCOUNTANT', 'AUDITOR'), getManagerialMIS);

// 4. CSV Export Engine (Staff/Audit only)
router.get('/export/:reportType', authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'ACCOUNTANT', 'AUDITOR'), exportReportCsv);

export default router;
