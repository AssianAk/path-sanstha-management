import { Response } from 'express';
import { prisma } from '../../config/db';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';

export async function getOrganizationDetails(req: AuthenticatedRequest, res: Response) {
  try {
    const org = await prisma.organization.findFirst({
      include: {
        branches: {
          select: { id: true, code: true, name: true, city: true, isActive: true }
        }
      }
    });

    return res.json({ success: true, organization: org });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch organization details.' });
  }
}

export async function getBranches(req: AuthenticatedRequest, res: Response) {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { code: 'asc' },
      include: {
        businessDates: {
          orderBy: { currentDate: 'desc' },
          take: 1
        },
        _count: {
          select: { users: true, counters: true, customers: true }
        }
      }
    });

    const formatted = branches.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      ifscCode: b.ifscCode,
      micrCode: b.micrCode,
      address: b.address,
      city: b.city,
      state: b.state,
      pincode: b.pincode,
      phone: b.phone,
      email: b.email,
      isActive: b.isActive,
      activeBusinessDate: b.businessDates[0]?.currentDate || '2026-09-11',
      businessDateStatus: b.businessDates[0]?.status || 'OPEN',
      counts: b._count
    }));

    return res.json({ success: true, branches: formatted });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch branches.' });
  }
}

export async function createBranch(req: AuthenticatedRequest, res: Response) {
  try {
    const { code, name, ifscCode, micrCode, address, city, state, pincode, phone, email } = req.body;

    if (!code || !name || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'Required fields missing for branch creation.' });
    }

    const org = await prisma.organization.findFirst();
    if (!org) {
      return res.status(400).json({ success: false, message: 'Organization master not found.' });
    }

    const existing = await prisma.branch.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Branch code '${code}' already exists.` });
    }

    const branch = await prisma.branch.create({
      data: {
        organizationId: org.id,
        code,
        name,
        ifscCode,
        micrCode,
        address,
        city,
        state,
        pincode,
        phone: phone || '',
        email: email || ''
      }
    });

    // Create initial business date for new branch
    const todayStr = new Date().toISOString().split('T')[0];
    await prisma.businessDate.create({
      data: {
        branchId: branch.id,
        currentDate: todayStr,
        status: 'OPEN',
        openedByUserId: req.user?.id
      }
    });

    await createAuditLog(req, {
      action: 'CREATE',
      entityName: 'BRANCH',
      entityId: branch.id,
      afterState: branch
    });

    return res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      branch
    });
  } catch (err: any) {
    console.error('Error creating branch:', err);
    return res.status(500).json({ success: false, message: 'Failed to create branch.' });
  }
}

export async function updateBusinessDate(req: AuthenticatedRequest, res: Response) {
  try {
    const { branchId, nextDate, status } = req.body;
    if (!branchId || !nextDate) {
      return res.status(400).json({ success: false, message: 'branchId and nextDate are required.' });
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found.' });
    }

    // Check existing
    const existingDate = await prisma.businessDate.findFirst({
      where: { branchId, status: 'OPEN' },
      orderBy: { currentDate: 'desc' }
    });

    if (existingDate && existingDate.currentDate !== nextDate) {
      // Mark old date CLOSED
      await prisma.businessDate.update({
        where: { id: existingDate.id },
        data: {
          status: 'CLOSED',
          closedByUserId: req.user?.id,
          closedAt: new Date()
        }
      });
    }

    // Upsert new date
    const bDate = await prisma.businessDate.upsert({
      where: { branchId_currentDate: { branchId, currentDate: nextDate } },
      update: { status: status || 'OPEN' },
      create: {
        branchId,
        currentDate: nextDate,
        status: status || 'OPEN',
        openedByUserId: req.user?.id
      }
    });

    await createAuditLog(req, {
      action: 'UPDATE',
      entityName: 'BUSINESS_DATE',
      entityId: bDate.id,
      beforeState: existingDate,
      afterState: bDate,
      businessDate: nextDate
    });

    return res.json({
      success: true,
      message: `Branch business date updated to ${nextDate} (${status || 'OPEN'})`,
      businessDate: bDate
    });
  } catch (err: any) {
    console.error('Error updating business date:', err);
    return res.status(500).json({ success: false, message: 'Failed to update business date.' });
  }
}
