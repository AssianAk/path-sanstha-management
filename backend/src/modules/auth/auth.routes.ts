import { Router } from 'express';
import { login, getCurrentUser, getRoles } from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.get('/roles', authenticate, getRoles);

export default router;
