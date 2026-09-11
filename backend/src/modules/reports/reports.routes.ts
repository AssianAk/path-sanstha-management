import { Router } from 'express';
import {
  getFormIReturn,
  getFormIXReturn,
  getMemberPassbook,
  getManagerialMIS,
  exportReportCsv
} from './reports.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// 1. Regulatory Statutory Returns
router.get('/form-i', getFormIReturn);
router.get('/form-ix', getFormIXReturn);

// 2. Member Passbook & Account Statement
router.get('/passbook/:accountNumber', getMemberPassbook);

// 3. Managerial MIS Executive Analytics
router.get('/managerial-mis', getManagerialMIS);

// 4. CSV Export Engine
router.get('/export/:reportType', exportReportCsv);

export default router;
