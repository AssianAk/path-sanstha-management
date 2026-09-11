import { Response } from 'express';
import { prisma } from '../../config/db';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function getAuditLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const { action, entityName, username, businessDate, limit = 100 } = req.query;

    const where: any = {};
    if (action) {
      where.action = String(action);
    }
    if (entityName) {
      where.entityName = String(entityName);
    }
    if (username) {
      where.username = { contains: String(username) };
    }
    if (businessDate) {
      where.businessDate = String(businessDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Math.min(parseInt(String(limit), 10) || 100, 500)
    });

    return res.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
}
