import { Response } from 'express';
import { prisma } from '../../config/db';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';

export async function getApprovalQueue(req: AuthenticatedRequest, res: Response) {
  try {
    const { status = 'PENDING', branchId } = req.query;

    const where: any = {};
    if (status) {
      where.status = String(status);
    }
    if (branchId) {
      where.branchId = String(branchId);
    }

    const items = await prisma.approvalQueue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        maker: { select: { username: true, fullName: true, role: { select: { name: true } } } },
        checker: { select: { username: true, fullName: true } },
        branch: { select: { code: true, name: true } }
      }
    });

    return res.json({ success: true, count: items.length, items });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve approval queue.' });
  }
}

export async function uploadKycDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const { customerId, documentType, documentNumber, documentUrl, verificationRemarks } = req.body;

    if (!customerId || !documentType || !documentNumber) {
      return res.status(400).json({ success: false, message: 'Customer ID, Document Type, and Document Number are required.' });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Check existing document of this type to handle versioning
    const latestDoc = await prisma.kycDocument.findFirst({
      where: { customerId, documentType },
      orderBy: { version: 'desc' }
    });

    let nextVersion = 1;
    if (latestDoc) {
      nextVersion = latestDoc.version + 1;
      // Mark old doc SUPERSEDED if it was VERIFIED
      if (latestDoc.status === 'VERIFIED') {
        await prisma.kycDocument.update({
          where: { id: latestDoc.id },
          data: { status: 'SUPERSEDED' }
        });
      }
    }

    const newDoc = await prisma.kycDocument.create({
      data: {
        customerId,
        documentType,
        documentNumber,
        documentUrl: documentUrl || null,
        version: nextVersion,
        status: 'PENDING',
        verificationRemarks: verificationRemarks || `Version ${nextVersion} submitted by Maker`
      }
    });

    // Create / Update ApprovalQueue item
    const queueItem = await prisma.approvalQueue.create({
      data: {
        module: 'KYC',
        entityId: customer.id,
        actionType: 'VERIFY',
        payloadJson: JSON.stringify({
          customerId: customer.id,
          customerNumber: customer.customerNumber,
          customerName: `${customer.title} ${customer.firstName} ${customer.lastName}`,
          documentType,
          documentNumber,
          version: nextVersion
        }),
        status: 'PENDING',
        makerUserId: req.user?.id!,
        makerRemarks: `Uploaded ${documentType} (v${nextVersion}). Awaiting Checker verification.`,
        branchId: customer.branchId
      }
    });

    await createAuditLog(req, {
      action: 'CREATE',
      entityName: 'KYC_DOCUMENT',
      entityId: newDoc.id,
      afterState: newDoc
    });

    return res.status(201).json({
      success: true,
      message: `KYC Document (${documentType} v${nextVersion}) uploaded and submitted to Checker approval queue.`,
      document: newDoc,
      approvalQueueId: queueItem.id
    });
  } catch (err: any) {
    console.error('Error uploading KYC doc:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload KYC document.' });
  }
}

export async function processApprovalAction(req: AuthenticatedRequest, res: Response) {
  try {
    const { queueId, action, remarks } = req.body; // action: APPROVE, REJECT, SEND_BACK

    if (!queueId || !action || !['APPROVE', 'REJECT', 'SEND_BACK'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Valid queueId and action (APPROVE, REJECT, SEND_BACK) are required.' });
    }

    const item = await prisma.approvalQueue.findUnique({
      where: { id: queueId },
      include: { branch: true }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Approval request not found.' });
    }

    if (item.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Request already resolved with status: ${item.status}` });
    }

    // Maker and Checker segregation: Checker cannot approve their own maker request
    if (item.makerUserId === req.user?.id && req.user?.roleCode !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Dual control violation: You cannot approve/reject a transaction that you created.'
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: item.entityId },
      include: { kycDocuments: true }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Associated customer record not found.' });
    }

    const beforeState = { customerStatus: customer.status, memberStatus: customer.memberStatus };
    let newStatus = 'APPROVED';

    if (action === 'APPROVE') {
      newStatus = 'APPROVED';

      // 1. Mark pending KYC documents as VERIFIED
      await prisma.kycDocument.updateMany({
        where: { customerId: customer.id, status: 'PENDING' },
        data: {
          status: 'VERIFIED',
          verifiedByUserId: req.user?.id,
          verifiedAt: new Date(),
          verificationRemarks: remarks || 'Approved by Checker'
        }
      });

      // 2. Activate customer and membership
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          status: 'ACTIVE',
          memberStatus: customer.isMember ? 'ACTIVE' : null,
          approvedByUserId: req.user?.id
        }
      });
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';

      await prisma.kycDocument.updateMany({
        where: { customerId: customer.id, status: 'PENDING' },
        data: {
          status: 'REJECTED',
          verifiedByUserId: req.user?.id,
          verifiedAt: new Date(),
          verificationRemarks: remarks || 'Rejected by Checker'
        }
      });

      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          status: 'INACTIVE',
          memberStatus: customer.isMember ? 'SUSPENDED' : null
        }
      });
    } else if (action === 'SEND_BACK') {
      newStatus = 'SENT_BACK';
      // Leaves documents in PENDING status for Maker to correct
    }

    // Update queue item
    const updatedQueue = await prisma.approvalQueue.update({
      where: { id: queueId },
      data: {
        status: newStatus,
        checkerUserId: req.user?.id,
        checkerRemarks: remarks || `Action: ${action}`,
        resolvedAt: new Date()
      }
    });

    const updatedCustomer = await prisma.customer.findUnique({ where: { id: customer.id } });

    await createAuditLog(req, {
      action: action as any,
      entityName: 'APPROVAL_QUEUE',
      entityId: item.id,
      beforeState: { queue: item, customer: beforeState },
      afterState: { queue: updatedQueue, customer: updatedCustomer }
    });

    return res.json({
      success: true,
      message: `Request successfully ${newStatus.toLowerCase()} by Checker.`,
      queueItem: updatedQueue,
      customer: updatedCustomer
    });
  } catch (err: any) {
    console.error('Error processing approval action:', err);
    return res.status(500).json({ success: false, message: 'Failed to process approval request.' });
  }
}
