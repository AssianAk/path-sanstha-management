import { Response } from 'express';
import { prisma } from '../../config/db';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';

export async function getProducts(req: AuthenticatedRequest, res: Response) {
  try {
    const { category } = req.query;
    const where: any = { isActive: true };
    if (category) {
      where.category = String(category);
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: { accounts: true }
        }
      }
    });

    return res.json({ success: true, count: products.length, products });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve products.' });
  }
}

export async function createProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      code,
      name,
      category,
      description,
      minBalance = 500,
      interestRate = 0,
      compoundingFrequency = 'QUARTERLY',
      tenureMinMonths = 0,
      tenureMaxMonths = 120,
      prematurePenaltyRate = 1.0,
      glAccountCode
    } = req.body;

    if (!code || !name || !category || !glAccountCode) {
      return res.status(400).json({
        success: false,
        message: 'Product code, name, category, and GL account code are required.'
      });
    }

    const existing = await prisma.product.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Product code '${code}' already exists.` });
    }

    const product = await prisma.product.create({
      data: {
        code,
        name,
        category,
        description,
        minBalance: Number(minBalance),
        interestRate: Number(interestRate),
        compoundingFrequency,
        tenureMinMonths: Number(tenureMinMonths),
        tenureMaxMonths: Number(tenureMaxMonths),
        prematurePenaltyRate: Number(prematurePenaltyRate),
        glAccountCode
      }
    });

    await createAuditLog(req, {
      action: 'CREATE',
      entityName: 'PRODUCT',
      entityId: product.id,
      afterState: product
    });

    return res.status(201).json({
      success: true,
      message: 'Deposit product created successfully',
      product
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
}
