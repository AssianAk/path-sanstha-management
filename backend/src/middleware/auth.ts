import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../config/jwt';
import { prisma } from '../config/db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    fullName: string;
    email: string;
    roleCode: string;
    branchId?: string | null;
  };
  businessDate?: string;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true, branch: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User account is invalid or deactivated.' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      roleCode: user.role.code,
      branchId: user.branchId
    };

    // Attach active business date for this branch if present
    if (user.branchId) {
      const bDate = await prisma.businessDate.findFirst({
        where: { branchId: user.branchId, status: 'OPEN' },
        orderBy: { currentDate: 'desc' }
      });
      if (bDate) {
        req.businessDate = bDate.currentDate;
      }
    }

    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
}
