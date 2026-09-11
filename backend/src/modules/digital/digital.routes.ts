import { Router } from 'express';
import {
  memberLogin,
  getMemberProfile,
  generateUpiQr,
  processPaymentWebhook,
  getNotificationLogs,
  createStandingInstruction,
  getStandingInstructions,
  runStandingInstructionsBatch
} from './digital.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public Member Login
router.post('/member/login', memberLogin);

// Protected routes
router.use(authenticate);

// Member Self-Service Portal
router.get('/member/profile', getMemberProfile);

// Digital UPI QR & Payments Rail
router.post('/upi-qr', generateUpiQr);
router.post('/payment-webhook', processPaymentWebhook);

// Notification Logs Register
router.get('/notifications', getNotificationLogs);

// Standing Instructions (e-Mandates)
router.get('/standing-instructions', getStandingInstructions);
router.post('/standing-instructions', createStandingInstruction);
router.post('/standing-instructions/run-batch', runStandingInstructionsBatch);

export default router;
