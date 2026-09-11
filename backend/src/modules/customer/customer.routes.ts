import { Router } from 'express';
import { getCustomers, getCustomerById, createCustomer } from './customer.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER', 'MAKER'),
  createCustomer
);

export default router;
