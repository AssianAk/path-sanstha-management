import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export function authorizeRoles(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // SUPER_ADMIN has master override
    if (req.user.roleCode === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.roleCode)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Requires one of roles: [${allowedRoles.join(', ')}], current role: ${req.user.roleCode}`
      });
    }

    next();
  };
}
