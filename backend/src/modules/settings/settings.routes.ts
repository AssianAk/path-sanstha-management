import { Router } from 'express';
import { getSettings, updateSetting } from './settings.controller';
import { authenticate } from '../../middleware/auth';
import { authorizeRoles } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/', getSettings);
router.put('/:key', authorizeRoles('SUPER_ADMIN', 'HO_ADMIN'), updateSetting);

export default router;
