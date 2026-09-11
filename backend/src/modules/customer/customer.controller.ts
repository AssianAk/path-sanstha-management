import { Response } from 'express';
import { prisma } from '../../config/db';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';

export async function getCustomers(req: AuthenticatedRequest, res: Response) {
  try {
    const { branchId, search, status, isMember } = req.query;

    const where: any = {};
    if (branchId) {
      where.branchId = String(branchId);
    }
    if (status) {
      where.status = String(status);
    }
    if (isMember !== undefined) {
      where.isMember = isMember === 'true';
    }
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { customerNumber: { contains: q } },
        { memberNumber: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { phone: { contains: q } },
        { pan: { contains: q } }
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { code: true, name: true } },
        nominees: true,
        addresses: true,
        kycDocuments: true,
        memberShares: true
      }
    });

    return res.json({ success: true, count: customers.length, customers });
  } catch (err: any) {
    console.error('Error getting customers:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve customers.' });
  }
}

export async function getCustomerById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        branch: true,
        addresses: true,
        nominees: true,
        kycDocuments: {
          orderBy: { createdAt: 'desc' }
        },
        memberShares: true,
        createdBy: { select: { username: true, fullName: true } },
        approvedBy: { select: { username: true, fullName: true } }
      }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    return res.json({ success: true, customer });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve customer details.' });
  }
}

export async function createCustomer(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      customerType = 'INDIVIDUAL',
      isMember = false,
      title = 'Mr.',
      firstName,
      middleName,
      lastName,
      dob,
      gender,
      maritalStatus,
      fatherOrSpouseName,
      occupation,
      annualIncome,
      pan,
      aadhaarLast4,
      phone,
      email,
      branchId,
      riskCategory = 'LOW',
      addresses = [],
      nominees = [],
      memberSharesCount = 0
    } = req.body;

    if (!firstName || !lastName || !dob || !gender || !phone) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, DOB, gender, and phone number are required.'
      });
    }

    const targetBranchId = branchId || req.user?.branchId;
    if (!targetBranchId) {
      return res.status(400).json({ success: false, message: 'Branch must be specified.' });
    }

    // Generate unique Customer Number: CUST-YYYY-XXXXX
    const currentYear = new Date().getFullYear();
    const countTotal = await prisma.customer.count();
    const seq = String(countTotal + 1).padStart(5, '0');
    const customerNumber = `CUST-${currentYear}-${seq}`;

    // If Member, generate Member Number: MEM-YYYY-XXXXX
    let memberNumber = null;
    let membershipDate = null;
    let memberStatus = null;
    if (isMember) {
      const memberCount = await prisma.customer.count({ where: { isMember: true } });
      const memSeq = String(memberCount + 1).padStart(5, '0');
      memberNumber = `MEM-${currentYear}-${memSeq}`;
      membershipDate = new Date();
      memberStatus = 'DORMANT'; // Becomes ACTIVE upon KYC Checker approval
    }

    const customer = await prisma.customer.create({
      data: {
        customerNumber,
        customerType,
        isMember,
        memberNumber,
        membershipDate,
        memberStatus,
        title,
        firstName,
        middleName,
        lastName,
        dob,
        gender,
        maritalStatus,
        fatherOrSpouseName,
        occupation,
        annualIncome: annualIncome ? parseFloat(annualIncome) : 0,
        pan: pan ? pan.toUpperCase() : null,
        aadhaarLast4: aadhaarLast4 ? String(aadhaarLast4).slice(-4) : null,
        phone,
        email,
        branchId: targetBranchId,
        riskCategory,
        status: 'PENDING_KYC',
        createdByUserId: req.user?.id,
        addresses: {
          create: addresses.map((a: any) => ({
            addressType: a.addressType || 'PERMANENT',
            line1: a.line1,
            line2: a.line2 || '',
            landmark: a.landmark || '',
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            isPrimary: a.isPrimary ?? true
          }))
        },
        nominees: {
          create: nominees.map((n: any) => ({
            name: n.name,
            relationship: n.relationship,
            dob: n.dob || null,
            age: n.age ? parseInt(n.age, 10) : null,
            phone: n.phone || null,
            address: n.address || null,
            allocationPercentage: n.allocationPercentage ? parseFloat(n.allocationPercentage) : 100.0,
            isMinor: n.isMinor || false,
            guardianName: n.guardianName || null,
            guardianRelation: n.guardianRelation || null,
            guardianPhone: n.guardianPhone || null
          }))
        },
        ...(isMember && memberSharesCount > 0
          ? {
              memberShares: {
                create: [
                  {
                    shareCertificateNumber: `CERT-${currentYear}-${seq}`,
                    distinctFrom: 1000 + countTotal * 10,
                    distinctTo: 1000 + countTotal * 10 + memberSharesCount,
                    totalShares: parseInt(memberSharesCount, 10),
                    faceValue: 10.0,
                    totalAmount: parseInt(memberSharesCount, 10) * 10.0,
                    status: 'ACTIVE'
                  }
                ]
              }
            }
          : {})
      },
      include: {
        branch: true,
        addresses: true,
        nominees: true,
        memberShares: true
      }
    });

    // Automatically create KYC Document placeholders if PAN or Aadhaar provided
    if (pan) {
      await prisma.kycDocument.create({
        data: {
          customerId: customer.id,
          documentType: 'PAN',
          documentNumber: pan.toUpperCase(),
          status: 'PENDING',
          verificationRemarks: 'Auto-registered during customer onboarding'
        }
      });
    }
    if (aadhaarLast4) {
      await prisma.kycDocument.create({
        data: {
          customerId: customer.id,
          documentType: 'AADHAAR',
          documentNumber: `XXXXXXXX${aadhaarLast4}`,
          status: 'PENDING',
          verificationRemarks: 'Auto-registered during customer onboarding'
        }
      });
    }

    // Insert into ApprovalQueue for Checker Review
    await prisma.approvalQueue.create({
      data: {
        module: 'CUSTOMER',
        entityId: customer.id,
        actionType: 'CREATE',
        payloadJson: JSON.stringify({
          customerId: customer.id,
          customerNumber: customer.customerNumber,
          customerName: `${customer.title} ${customer.firstName} ${customer.lastName}`,
          isMember: customer.isMember,
          memberNumber: customer.memberNumber,
          riskCategory: customer.riskCategory,
          branch: customer.branch.name
        }),
        status: 'PENDING',
        makerUserId: req.user?.id!,
        makerRemarks: `New ${isMember ? 'Member' : 'Customer'} registered by Maker. Ready for Checker KYC review.`,
        branchId: targetBranchId
      }
    });

    await createAuditLog(req, {
      action: 'CREATE',
      entityName: 'CUSTOMER',
      entityId: customer.id,
      afterState: customer
    });

    return res.status(201).json({
      success: true,
      message: `${isMember ? 'Member' : 'Customer'} created successfully. Sent to Checker Approval Queue.`,
      customer
    });
  } catch (err: any) {
    console.error('Error creating customer:', err);
    return res.status(500).json({ success: false, message: 'Failed to create customer.' });
  }
}
