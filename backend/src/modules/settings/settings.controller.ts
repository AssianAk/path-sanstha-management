import { Response } from 'express';
import { prisma } from '../../config/db';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';

export async function getSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { category: 'asc' }
    });
    return res.json({ success: true, settings });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve settings.' });
  }
}

export async function updateSetting(req: AuthenticatedRequest, res: Response) {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const existing = await prisma.systemSetting.findUnique({ where: { key } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Setting not found.' });
    }

    if (!existing.isEditable) {
      return res.status(403).json({ success: false, message: 'This system setting cannot be modified.' });
    }

    const updated = await prisma.systemSetting.update({
      where: { key },
      data: { value }
    });

    await createAuditLog(req, {
      action: 'UPDATE',
      entityName: 'SYSTEM_SETTING',
      entityId: key,
      beforeState: existing,
      afterState: updated
    });

    return res.json({ success: true, message: `Setting ${key} updated successfully.`, setting: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update setting.' });
  }
}
