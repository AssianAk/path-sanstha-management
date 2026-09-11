import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db';
import { signToken } from '../../config/jwt';
import { createAuditLog } from '../../middleware/audit';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true, branch: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid username or inactive account.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password credentials.' });
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = signToken({
      userId: user.id,
      username: user.username,
      roleCode: user.role.code,
      branchId: user.branchId
    });

    // Fetch active business date for this branch
    let activeBusinessDate = '2026-09-11';
    if (user.branchId) {
      const bDate = await prisma.businessDate.findFirst({
        where: { branchId: user.branchId, status: 'OPEN' },
        orderBy: { currentDate: 'desc' }
      });
      if (bDate) {
        activeBusinessDate = bDate.currentDate;
      }
    }

    // Write audit log for login
    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      roleCode: user.role.code,
      branchId: user.branchId
    };
    authReq.businessDate = activeBusinessDate;

    await createAuditLog(authReq, {
      action: 'LOGIN',
      entityName: 'USER_SESSION',
      entityId: user.id,
      afterState: { username: user.username, role: user.role.code, branch: user.branch?.name }
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role.code,
        roleName: user.role.name,
        branchId: user.branchId,
        branchName: user.branch?.name || 'Head Office',
        branchCode: user.branch?.code || 'HO'
      },
      businessDate: activeBusinessDate
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true, branch: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role.code,
        roleName: user.role.name,
        branchId: user.branchId,
        branchName: user.branch?.name || 'Head Office',
        branchCode: user.branch?.code || 'HO'
      },
      businessDate: req.businessDate || '2026-09-11'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error retrieving user details.' });
  }
}

export async function getRoles(req: Request, res: Response) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { code: 'asc' }
    });
    return res.json({ success: true, roles });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve roles.' });
  }
}
