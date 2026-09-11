import { prisma } from '../config/db';
import { AuthenticatedRequest } from './auth';

export interface AuditLogOptions {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'SEND_BACK' | 'LOGIN' | 'LOGOUT';
  entityName: string;
  entityId?: string | null;
  beforeState?: any;
  afterState?: any;
  businessDate?: string;
  customDetails?: string;
}

export async function createAuditLog(req: AuthenticatedRequest, options: AuditLogOptions) {
  try {
    const userId = req.user?.id || null;
    const username = req.user?.username || 'SYSTEM';
    const userRole = req.user?.roleCode || 'SYSTEM';
    const branchId = req.user?.branchId || null;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const businessDate = options.businessDate || req.businessDate || new Date().toISOString().split('T')[0];

    return await prisma.auditLog.create({
      data: {
        userId,
        username,
        userRole,
        branchId,
        action: options.action,
        entityName: options.entityName,
        entityId: options.entityId || null,
        beforeStateJson: options.beforeState ? JSON.stringify(options.beforeState) : null,
        afterStateJson: options.afterState ? JSON.stringify(options.afterState) : null,
        ipAddress,
        userAgent,
        businessDate
      }
    });
  } catch (err) {
    console.error('⚠️ Failed to write audit log:', err);
  }
}
