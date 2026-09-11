import { Response } from 'express';
import { prisma } from '../../config/db';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';

export async function processInternalTransfer(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      sourceAccountNumber,
      destinationAccountNumber,
      amount,
      narration = 'Internal account to account transfer'
    } = req.body;

    const parsedAmount = Number(amount);
    if (!sourceAccountNumber || !destinationAccountNumber || !parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Source account, destination account, and positive transfer amount are required.'
      });
    }

    if (sourceAccountNumber === destinationAccountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination accounts cannot be identical.'
      });
    }

    // Lookup accounts
    const sourceAccount = await prisma.account.findUnique({
      where: { accountNumber: sourceAccountNumber },
      include: { product: true, customer: true }
    });

    if (!sourceAccount) {
      return res.status(404).json({ success: false, message: `Source account '${sourceAccountNumber}' not found.` });
    }

    if (sourceAccount.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Source account is in '${sourceAccount.status}' state. Transfer restricted.`
      });
    }

    if (sourceAccount.availableBalance < parsedAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available funds in source account. Current available: ₹${sourceAccount.availableBalance.toLocaleString()}`
      });
    }

    const destAccount = await prisma.account.findUnique({
      where: { accountNumber: destinationAccountNumber },
      include: { product: true, customer: true }
    });

    if (!destAccount) {
      return res.status(404).json({ success: false, message: `Beneficiary account '${destinationAccountNumber}' not found.` });
    }

    if (destAccount.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Beneficiary account is in '${destAccount.status}' state. Cannot receive funds.`
      });
    }

    const businessDate = req.businessDate || '2026-09-11';
    const txCount = await prisma.transaction.count();
    const txSeq = String(txCount + 1).padStart(5, '0');
    const txDateCompact = businessDate.replace(/-/g, '');
    const transactionReference = `TXN-${txDateCompact}-${txSeq}`;

    // ACID transaction
    const postedTx = await prisma.$transaction(async (tx) => {
      // 1. Debit Source
      const updatedSource = await tx.account.update({
        where: { id: sourceAccount.id },
        data: {
          ledgerBalance: { decrement: parsedAmount },
          availableBalance: { decrement: parsedAmount }
        }
      });

      // 2. Credit Destination
      const updatedDest = await tx.account.update({
        where: { id: destAccount.id },
        data: {
          ledgerBalance: { increment: parsedAmount },
          availableBalance: { increment: parsedAmount }
        }
      });

      // 3. Create Transaction Header
      const transaction = await tx.transaction.create({
        data: {
          transactionReference,
          transactionType: 'INTERNAL_TRANSFER',
          channel: 'BRANCH_TELLER',
          branchId: sourceAccount.branchId,
          businessDate,
          sourceAccountId: sourceAccount.id,
          destinationAccountId: destAccount.id,
          amount: parsedAmount,
          narration,
          status: 'POSTED',
          makerUserId: req.user?.id!,
          // 4. Balanced Double-Entry Journal Lines
          journalLines: {
            create: [
              {
                glAccountCode: sourceAccount.product.glAccountCode,
                glAccountName: `Deposit Liability (${sourceAccount.product.name})`,
                entryType: 'DEBIT',
                amount: parsedAmount,
                businessDate,
                accountId: sourceAccount.id
              },
              {
                glAccountCode: destAccount.product.glAccountCode,
                glAccountName: `Deposit Liability (${destAccount.product.name})`,
                entryType: 'CREDIT',
                amount: parsedAmount,
                businessDate,
                accountId: destAccount.id
              }
            ]
          }
        },
        include: { journalLines: true }
      });

      return { transaction, updatedSource, updatedDest };
    });

    await createAuditLog(req, {
      action: 'CREATE',
      entityName: 'TRANSACTION',
      entityId: postedTx.transaction.id,
      afterState: {
        reference: transactionReference,
        type: 'INTERNAL_TRANSFER',
        from: sourceAccountNumber,
        to: destinationAccountNumber,
        amount: parsedAmount,
        sourceBalance: postedTx.updatedSource.availableBalance,
        destBalance: postedTx.updatedDest.availableBalance
      },
      businessDate
    });

    return res.status(201).json({
      success: true,
      message: `Fund transfer of ₹${parsedAmount.toLocaleString()} completed successfully.`,
      transaction: postedTx.transaction,
      receipt: {
        reference: transactionReference,
        date: businessDate,
        timestamp: new Date().toISOString(),
        amount: parsedAmount,
        fromAccount: sourceAccountNumber,
        fromCustomer: `${sourceAccount.customer.title} ${sourceAccount.customer.firstName} ${sourceAccount.customer.lastName}`,
        toAccount: destinationAccountNumber,
        toCustomer: `${destAccount.customer.title} ${destAccount.customer.firstName} ${destAccount.customer.lastName}`,
        narration,
        newSourceBalance: postedTx.updatedSource.availableBalance
      }
    });
  } catch (err: any) {
    console.error('Error processing transfer:', err);
    return res.status(500).json({ success: false, message: 'Failed to process transfer.' });
  }
}

export async function validateBeneficiaryAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const { accountNumber } = req.params;
    const account = await prisma.account.findUnique({
      where: { accountNumber },
      include: {
        customer: { select: { title: true, firstName: true, lastName: true } },
        product: { select: { name: true, category: true } },
        branch: { select: { name: true, code: true } }
      }
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    return res.json({
      success: true,
      accountNumber: account.accountNumber,
      accountHolderName: `${account.customer.title} ${account.customer.firstName} ${account.customer.lastName}`,
      productName: account.product.name,
      branchName: account.branch.name,
      status: account.status,
      isTransferAllowed: account.status === 'ACTIVE'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error validating beneficiary.' });
  }
}
