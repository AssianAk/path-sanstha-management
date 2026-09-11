import { Router } from 'express';
import { getProducts, createProduct } from './product.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', getProducts);
router.post('/', authorizeRoles('SUPER_ADMIN', 'HO_ADMIN'), createProduct);

export default router;
