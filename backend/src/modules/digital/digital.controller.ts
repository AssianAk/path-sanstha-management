import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db';
import { signToken } from '../../config/jwt';
import { AuthenticatedRequest } from '../../middleware/auth';
import { createAuditLog } from '../../middleware/audit';

// -------------------------------------------------------------
// 1. Member Digital Portal Login
// -------------------------------------------------------------
export async function memberLogin(req: AuthenticatedRequest, res: Response) {
  try {
    const { identifier, password, mpin } = req.body;

    if (!identifier || (!password && !mpin)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customer number / phone and your password or 4-digit MPIN.'
      });
    }

    const trimmed = String(identifier).trim();

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { customerNumber: trimmed },
          { phone: trimmed },
          { memberNumber: trimmed }
        ]
      },
      include: {
        branch: true
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Member account not found with the provided credentials.'
      });
    }

    if (customer.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Your member account is currently '${customer.status}'. Access is restricted.`
      });
    }

    let isValid = false;

    if (mpin && customer.mpin) {
      isValid = customer.mpin === String(mpin).trim();
    } else if (password && customer.passwordHash) {
      isValid = await bcrypt.compare(String(password), customer.passwordHash);
    }

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password or MPIN. Please try again.'
      });
    }

    const token = signToken({
      userId: customer.id,
      username: customer.customerNumber,
      roleCode: 'MEMBER',
      branchId: customer.branchId
    });

    // Record login notification
    await prisma.notificationLog.create({
      data: {
        recipientPhone: customer.phone,
        recipientEmail: customer.email,
        channel: 'SMS',
        category: 'ALERT',
        templateCode: 'MEMBER_PORTAL_LOGIN',
        title: 'Member Portal Login Alert',
        message: `Dear ${customer.firstName}, you have logged into Samruddhi Co-op Bank Member Portal on ${new Date().toLocaleDateString('en-IN')}. If not you, contact branch immediately.`,
        status: 'DELIVERED',
        deliveryRef: `SMS-LOG-${Date.now()}`,
        customerId: customer.id,
        businessDate: req.businessDate || '2026-09-11'
      }
    });

    return res.json({
      success: true,
      message: `Welcome back, ${customer.title} ${customer.firstName} ${customer.lastName}!`,
      token,
      member: {
        id: customer.id,
        customerNumber: customer.customerNumber,
        isMember: customer.isMember,
        memberNumber: customer.memberNumber,
        title: customer.title,
        fullName: `${customer.title} ${customer.firstName} ${customer.lastName}`,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        email: customer.email,
        branch: {
          code: customer.branch.code,
          name: customer.branch.name
        }
      }
    });
  } catch (err: any) {
    console.error('Member login error:', err);
    return res.status(500).json({ success: false, message: 'Member authentication failed.' });
  }
}

// -------------------------------------------------------------
// 2. Member 360 Profile & Accounts Overview
// -------------------------------------------------------------
export async function getMemberProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        branch: true,
        addresses: true,
        nominees: true,
        memberShares: true,
        accounts: {
          include: {
            product: true,
            termDepositDetail: true
          }
        },
        loanAccounts: {
          include: {
            loanProduct: true,
            installments: {
              where: { status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } },
              orderBy: { installmentNumber: 'asc' },
              take: 3
            }
          }
        },
        standingInstructions: {
          include: {
            sourceAccount: { select: { accountNumber: true } }
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    // Calculate aggregate metrics
    const totalDepositBalance = customer.accounts.reduce((sum, a) => sum + a.availableBalance, 0);
    const totalLoanOutstanding = customer.loanAccounts.reduce((sum, l) => sum + l.principalOutstanding, 0);
    const totalShareValue = customer.memberShares.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalShareCount = customer.memberShares.reduce((sum, s) => sum + (s.totalShares || 0), 0);

    // Recent transactions for this customer's accounts
    const accountIds = customer.accounts.map(a => a.id);
    const recentLines = await prisma.transactionLine.findMany({
      where: { accountId: { in: accountIds } },
      include: {
        transaction: {
          select: {
            transactionReference: true,
            transactionType: true,
            channel: true,
            narration: true,
            businessDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return res.json({
      success: true,
      member: {
        id: customer.id,
        customerNumber: customer.customerNumber,
        isMember: customer.isMember,
        memberNumber: customer.memberNumber,
        fullName: `${customer.title} ${customer.firstName} ${customer.lastName}`,
        phone: customer.phone,
        email: customer.email,
        pan: customer.pan,
        status: customer.status,
        riskCategory: customer.riskCategory,
        branch: {
          code: customer.branch.code,
          name: customer.branch.name,
          phone: customer.branch.phone
        },
        address: customer.addresses[0] || null,
        nominee: customer.nominees[0] || null
      },
      aggregates: {
        totalDepositBalance: Math.round(totalDepositBalance * 100) / 100,
        totalLoanOutstanding: Math.round(totalLoanOutstanding * 100) / 100,
        totalShareValue: Math.round(totalShareValue * 100) / 100,
        totalShareCount,
        accountsCount: customer.accounts.length,
        loansCount: customer.loanAccounts.length
      },
      accounts: customer.accounts.map(a => ({
        id: a.id,
        accountNumber: a.accountNumber,
        productCode: a.product.code,
        productName: a.product.name,
        category: a.product.category,
        ledgerBalance: a.ledgerBalance,
        availableBalance: a.availableBalance,
        status: a.status,
        interestRate: a.termDepositDetail ? a.termDepositDetail.interestRate : a.product.interestRate,
        maturityDate: a.termDepositDetail?.maturityDate || null,
        maturityAmount: a.termDepositDetail?.maturityAmount || null
      })),
      loans: customer.loanAccounts.map(l => ({
        id: l.id,
        loanAccountNumber: l.loanAccountNumber,
        productName: l.loanProduct.name,
        productCode: l.loanProduct.code,
        sanctionedAmount: l.sanctionedAmount,
        principalOutstanding: l.principalOutstanding,
        interestRate: l.interestRate,
        emiAmount: l.emiAmount,
        maturityDate: l.maturityDate,
        status: l.status,
        dpd: l.dpd,
        nextInstallment: l.installments[0] || null
      })),
      standingInstructions: customer.standingInstructions,
      recentTransactions: recentLines.map(l => ({
        reference: l.transaction.transactionReference,
        date: l.businessDate,
        type: l.transaction.transactionType,
        narration: l.transaction.narration,
        entryType: l.entryType,
        amount: l.amount
      }))
    });
  } catch (err: any) {
    console.error('Error fetching member profile:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve member dashboard.' });
  }
}

// -------------------------------------------------------------
// 3. Dynamic UPI QR Code Generation
// -------------------------------------------------------------
export async function generateUpiQr(req: AuthenticatedRequest, res: Response) {
  try {
    const { amount, purpose = 'SAVINGS_DEPOSIT', accountNumber, loanAccountNumber } = req.body;
    const parsedAmount = Math.round(Number(amount) * 100) / 100;

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Positive amount is required for QR generation.' });
    }

    const businessDate = req.businessDate || '2026-09-11';
    const currentYear = new Date().getFullYear();
    const count = await prisma.digitalPaymentRequest.count();
    const seq = String(count + 1).padStart(5, '0');
    const paymentReference = `PAY-${currentYear}-${seq}`;

    // Construct NPCI Standard UPI Intent URI
    const bankVpa = 'samruddhi.bank@icici';
    const payeeName = 'Samruddhi Co-op Bank Ltd.';
    const noteText = purpose === 'LOAN_REPAYMENT'
      ? `Loan Repayment ${loanAccountNumber || ''}`
      : `Deposit to ${accountNumber || 'Savings'}`;

    const upiIntentUrl = `upi://pay?pa=${bankVpa}&pn=${encodeURIComponent(payeeName)}&tr=${paymentReference}&am=${parsedAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(noteText)}`;

    // Simple robust SVG QR Code representation for zero-dependency browser display
    const qrData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="#ffffff"/><rect x="20" y="20" width="50" height="50" fill="#0f172a"/><rect x="30" y="30" width="30" height="30" fill="#ffffff"/><rect x="37" y="37" width="16" height="16" fill="#0f172a"/><rect x="130" y="20" width="50" height="50" fill="#0f172a"/><rect x="140" y="30" width="30" height="30" fill="#ffffff"/><rect x="147" y="37" width="16" height="16" fill="#0f172a"/><rect x="20" y="130" width="50" height="50" fill="#0f172a"/><rect x="30" y="140" width="30" height="30" fill="#ffffff"/><rect x="37" y="147" width="16" height="16" fill="#0f172a"/><circle cx="100" cy="100" r="16" fill="#4f46e5"/><text x="100" y="104" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">UPI</text></svg>`;

    const paymentRequest = await prisma.digitalPaymentRequest.create({
      data: {
        paymentReference,
        upiIntentUrl,
        qrData,
        customerId: req.user?.id || null,
        accountNumber: accountNumber || null,
        loanAccountNumber: loanAccountNumber || null,
        purpose,
        amount: parsedAmount,
        status: 'PENDING',
        businessDate
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Dynamic UPI payment request created successfully.',
      paymentRequest: {
        id: paymentRequest.id,
        paymentReference: paymentRequest.paymentReference,
        upiIntentUrl: paymentRequest.upiIntentUrl,
        qrData: paymentRequest.qrData,
        amount: paymentRequest.amount,
        purpose: paymentRequest.purpose,
        payeeVpa: bankVpa,
        payeeName,
        status: paymentRequest.status
      }
    });
  } catch (err: any) {
    console.error('Error generating UPI QR:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate UPI QR.' });
  }
}

// -------------------------------------------------------------
// 4. Payment Gateway / UPI Settlement Webhook
// -------------------------------------------------------------
export async function processPaymentWebhook(req: AuthenticatedRequest, res: Response) {
  try {
    const { paymentReference, utrNumber } = req.body;

    if (!paymentReference) {
      return res.status(400).json({ success: false, message: 'Payment reference is required.' });
    }

    const payReq = await prisma.digitalPaymentRequest.findUnique({
      where: { paymentReference }
    });

    if (!payReq) {
      return res.status(404).json({ success: false, message: `Payment request '${paymentReference}' not found.` });
    }

    if (payReq.status === 'SUCCESS') {
      return res.json({
        success: true,
        message: 'Payment was already settled previously.',
        payment: payReq
      });
    }

    const generatedUtr = utrNumber || `UPI${Date.now()}`;
    const businessDate = payReq.businessDate || '2026-09-11';
    const amount = payReq.amount;

    // Apply double entry financial settlement
    let settledRef = '';

    await prisma.$transaction(async (tx) => {
      const txCount = await tx.transaction.count();
      const txSeq = String(txCount + 1).padStart(5, '0');
      const txDateCompact = businessDate.replace(/-/g, '');
      settledRef = `TXN-${txDateCompact}-${txSeq}`;

      const sysUser = await tx.user.findFirst({
        where: { role: { code: { in: ['SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER'] } } }
      });
      const systemMakerId = sysUser ? sysUser.id : (req.user?.id || '');

      let destAccount: any = null;
      let targetLoan: any = null;

      if (payReq.accountNumber) {
        destAccount = await tx.account.findUnique({
          where: { accountNumber: payReq.accountNumber },
          include: { product: true }
        });
      }

      if (payReq.loanAccountNumber) {
        targetLoan = await tx.loanAccount.findUnique({
          where: { loanAccountNumber: payReq.loanAccountNumber },
          include: { loanProduct: true }
        });
      }

      // 1. If Deposit Account Payment
      if (destAccount) {
        await tx.account.update({
          where: { id: destAccount.id },
          data: {
            ledgerBalance: { increment: amount },
            availableBalance: { increment: amount }
          }
        });

        await tx.transaction.create({
          data: {
            transactionReference: settledRef,
            transactionType: 'CASH_DEPOSIT',
            channel: 'DIGITAL_UPI',
            branchId: destAccount.branchId,
            businessDate,
            destinationAccountId: destAccount.id,
            amount,
            narration: `UPI Credit UTR:${generatedUtr} Ref:${paymentReference}`,
            status: 'POSTED',
            makerUserId: systemMakerId,
            journalLines: {
              create: [
                {
                  glAccountCode: 'GL-1002',
                  glAccountName: 'Balances with Apex / UPI Clearing Bank',
                  entryType: 'DEBIT',
                  amount,
                  businessDate
                },
                {
                  glAccountCode: destAccount.product.glAccountCode,
                  glAccountName: `Deposit Liability (${destAccount.product.name})`,
                  entryType: 'CREDIT',
                  amount,
                  businessDate,
                  accountId: destAccount.id
                }
              ]
            }
          }
        });
      } else if (targetLoan) {
        // 2. If Loan EMI Repayment
        const newBal = Math.max(0, targetLoan.principalOutstanding - amount);
        await tx.loanAccount.update({
          where: { id: targetLoan.id },
          data: {
            principalOutstanding: newBal,
            totalPrincipalPaid: { increment: amount }
          }
        });

        await tx.transaction.create({
          data: {
            transactionReference: settledRef,
            transactionType: 'LOAN_REPAYMENT',
            channel: 'DIGITAL_UPI',
            branchId: targetLoan.branchId,
            businessDate,
            amount,
            narration: `UPI Loan Repayment UTR:${generatedUtr} Ref:${paymentReference}`,
            status: 'POSTED',
            makerUserId: systemMakerId,
            journalLines: {
              create: [
                {
                  glAccountCode: 'GL-1002',
                  glAccountName: 'Balances with Apex / UPI Clearing Bank',
                  entryType: 'DEBIT',
                  amount,
                  businessDate
                },
                {
                  glAccountCode: targetLoan.loanProduct.glAssetCode || 'GL-1002',
                  glAccountName: `Loan Principal Asset (${targetLoan.loanProduct.name})`,
                  entryType: 'CREDIT',
                  amount,
                  businessDate
                }
              ]
            }
          }
        });
      } else {
        // Default: Member Capital or General Inward Transfer
        await tx.transaction.create({
          data: {
            transactionReference: settledRef,
            transactionType: 'INTERNAL_TRANSFER',
            channel: 'DIGITAL_UPI',
            branchId: 'b1',
            businessDate,
            amount,
            narration: `UPI Inward Payment UTR:${generatedUtr} Ref:${paymentReference}`,
            status: 'POSTED',
            makerUserId: systemMakerId,
            journalLines: {
              create: [
                {
                  glAccountCode: 'GL-1002',
                  glAccountName: 'Balances with Apex / UPI Clearing Bank',
                  entryType: 'DEBIT',
                  amount,
                  businessDate
                },
                {
                  glAccountCode: 'GL-3001',
                  glAccountName: 'Member Share Capital / Inward Fund',
                  entryType: 'CREDIT',
                  amount,
                  businessDate
                }
              ]
            }
          }
        });
      }

      // Update Digital Payment Request
      await tx.digitalPaymentRequest.update({
        where: { id: payReq.id },
        data: {
          status: 'SUCCESS',
          utrNumber: generatedUtr,
          settledTransactionReference: settledRef,
          settledAt: new Date()
        }
      });

      // Dispatch Transaction SMS & WhatsApp Alerts
      const customer = payReq.customerId ? await tx.customer.findUnique({ where: { id: payReq.customerId } }) : null;
      const targetPhone = customer?.phone || '9822012345';
      const targetEmail = customer?.email || 'member@samruddhibank.in';

      await tx.notificationLog.create({
        data: {
          recipientPhone: targetPhone,
          recipientEmail: targetEmail,
          channel: 'SMS',
          category: 'TRANSACTION',
          templateCode: 'UPI_PAYMENT_SUCCESS',
          title: 'UPI Payment Credited',
          message: `Dear Customer, ₹${amount.toFixed(2)} received via UPI (UTR: ${generatedUtr}) towards ${payReq.purpose}. CBS Ref: ${settledRef}. Samruddhi Co-op Bank.`,
          status: 'DELIVERED',
          deliveryRef: `SMS-${generatedUtr}`,
          customerId: payReq.customerId,
          businessDate
        }
      });

      await tx.notificationLog.create({
        data: {
          recipientPhone: targetPhone,
          recipientEmail: targetEmail,
          channel: 'WHATSAPP',
          category: 'TRANSACTION',
          templateCode: 'WA_UPI_RECEIPT',
          title: 'Digital Payment Receipt',
          message: `✅ *Payment Confirmed!* ₹${amount.toFixed(2)} credited via UPI. UTR: ${generatedUtr}. Thank you for banking with Samruddhi Co-operative Bank!`,
          status: 'DELIVERED',
          deliveryRef: `WA-${generatedUtr}`,
          customerId: payReq.customerId,
          businessDate
        }
      });
    });

    return res.json({
      success: true,
      message: `Payment of ₹${amount.toFixed(2)} successfully settled via UPI.`,
      utrNumber: generatedUtr,
      settledTransactionReference: settledRef,
      notificationDispatched: true
    });
  } catch (err: any) {
    console.error('Payment webhook error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process payment settlement.' });
  }
}

// -------------------------------------------------------------
// 5. Notification Register & Audit Logs
// -------------------------------------------------------------
export async function getNotificationLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const { channel, category, customerId } = req.query;
    const where: any = {};

    if (channel) where.channel = String(channel);
    if (category) where.category = String(category);
    if (customerId) where.customerId = String(customerId);

    // If member is viewing, constrain to their own notifications
    if (req.user?.roleCode === 'MEMBER') {
      where.customerId = req.user.id;
    }

    const logs = await prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        customer: {
          select: {
            customerNumber: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return res.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notification logs.' });
  }
}

// -------------------------------------------------------------
// 6. Standing Instructions (e-Mandate) Engine
// -------------------------------------------------------------
export async function createStandingInstruction(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      sourceAccountId,
      instructionType,
      targetAccountId,
      targetLoanId,
      amount,
      executionDay = 1,
      startDate,
      frequency = 'MONTHLY'
    } = req.body;

    const parsedAmount = Math.round(Number(amount) * 100) / 100;
    if (!sourceAccountId || !instructionType || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid source account, instruction type (RECURRING_DEPOSIT/LOAN_EMI), and positive amount required.'
      });
    }

    const sourceAccount = await prisma.account.findUnique({
      where: { id: sourceAccountId },
      include: { customer: true }
    });

    if (!sourceAccount) {
      return res.status(404).json({ success: false, message: 'Source account not found.' });
    }

    const businessDate = req.businessDate || '2026-09-11';
    const effectiveStart = startDate || businessDate;

    const count = await prisma.standingInstruction.count();
    const mandateNumber = `SI-2026-${String(count + 1).padStart(5, '0')}`;

    const si = await prisma.standingInstruction.create({
      data: {
        mandateNumber,
        customerId: sourceAccount.customerId,
        sourceAccountId,
        instructionType,
        targetAccountId: targetAccountId || null,
        targetLoanId: targetLoanId || null,
        amount: parsedAmount,
        frequency,
        executionDay: Number(executionDay) || 1,
        startDate: effectiveStart,
        nextExecutionDate: effectiveStart,
        status: 'ACTIVE'
      }
    });

    // Queue confirmation SMS
    await prisma.notificationLog.create({
      data: {
        recipientPhone: sourceAccount.customer.phone,
        channel: 'SMS',
        category: 'ALERT',
        templateCode: 'SI_MANDATE_REGISTERED',
        title: 'Standing Instruction Mandate Created',
        message: `Dear Customer, e-Mandate ${mandateNumber} of ₹${parsedAmount.toFixed(2)} from A/c ${sourceAccount.accountNumber} has been registered successfully. Samruddhi Co-op Bank.`,
        status: 'DELIVERED',
        deliveryRef: `SMS-${mandateNumber}`,
        customerId: sourceAccount.customerId,
        businessDate
      }
    });

    return res.status(201).json({
      success: true,
      message: `Standing instruction ${mandateNumber} registered successfully.`,
      standingInstruction: si
    });
  } catch (err: any) {
    console.error('Error creating standing instruction:', err);
    return res.status(500).json({ success: false, message: 'Failed to create standing instruction.' });
  }
}

export async function getStandingInstructions(req: AuthenticatedRequest, res: Response) {
  try {
    const where: any = {};
    if (req.user?.roleCode === 'MEMBER') {
      where.customerId = req.user.id;
    }

    const instructions = await prisma.standingInstruction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            customerNumber: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        sourceAccount: {
          include: { product: true }
        },
        executionLogs: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    });

    return res.json({ success: true, count: instructions.length, instructions });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch standing instructions.' });
  }
}

// -------------------------------------------------------------
// 7. Standing Instructions Batch Runner (EOD / Periodic Scheduler)
// -------------------------------------------------------------
export async function runStandingInstructionsBatch(req: AuthenticatedRequest, res: Response) {
  try {
    const businessDate = req.businessDate || '2026-09-11';

    const activeInstructions = await prisma.standingInstruction.findMany({
      where: {
        status: 'ACTIVE',
        nextExecutionDate: { lte: businessDate }
      },
      include: {
        sourceAccount: { include: { product: true } },
        customer: true
      }
    });

    let successCount = 0;
    let failedCount = 0;
    const executionResults: any[] = [];

    for (const si of activeInstructions) {
      const source = si.sourceAccount;

      // Check available funds
      if (source.availableBalance < si.amount) {
        // Insufficient funds
        await prisma.standingInstruction.update({
          where: { id: si.id },
          data: { failureCount: { increment: 1 } }
        });

        await prisma.standingInstructionLog.create({
          data: {
            standingInstructionId: si.id,
            executionDate: businessDate,
            amount: si.amount,
            status: 'SKIPPED_INSUFFICIENT_FUNDS',
            failureReason: `Available balance ₹${source.availableBalance} is less than mandate amount ₹${si.amount}.`
          }
        });

        await prisma.notificationLog.create({
          data: {
            recipientPhone: si.customer.phone,
            channel: 'SMS',
            category: 'ALERT',
            templateCode: 'SI_EXECUTION_FAILED',
            title: 'Auto-Debit Failed: Insufficient Balance',
            message: `Dear Member, standing instruction ${si.mandateNumber} for ₹${si.amount} failed due to insufficient funds in A/c ${source.accountNumber}. Please fund your account to avoid penal interest.`,
            status: 'DELIVERED',
            deliveryRef: `SMS-FAIL-${si.mandateNumber}`,
            customerId: si.customerId,
            businessDate
          }
        });

        failedCount++;
        executionResults.push({
          mandateNumber: si.mandateNumber,
          status: 'FAILED',
          reason: 'INSUFFICIENT_FUNDS'
        });
        continue;
      }

      // Execute auto-debit atomically
      let txnRef = '';
      await prisma.$transaction(async (tx) => {
        const txCount = await tx.transaction.count();
        const txSeq = String(txCount + 1).padStart(5, '0');
        const txDateCompact = businessDate.replace(/-/g, '');
        txnRef = `TXN-${txDateCompact}-${txSeq}`;

        // Debit source account
        await tx.account.update({
          where: { id: source.id },
          data: {
            ledgerBalance: { decrement: si.amount },
            availableBalance: { decrement: si.amount }
          }
        });

        // Credit target
        let targetGlCode = 'GL-2004'; // default RD
        let targetGlName = 'Recurring Deposit Liability (RD)';

        if (si.targetAccountId) {
          await tx.account.update({
            where: { id: si.targetAccountId },
            data: {
              ledgerBalance: { increment: si.amount },
              availableBalance: { increment: si.amount }
            }
          });
        } else if (si.targetLoanId) {
          const loan = await tx.loanAccount.findUnique({ where: { id: si.targetLoanId }, include: { loanProduct: true } });
          if (loan) {
            targetGlCode = loan.loanProduct.glAssetCode || 'GL-1002';
            targetGlName = `Loan Principal Asset (${loan.loanProduct.name})`;
            await tx.loanAccount.update({
              where: { id: loan.id },
              data: {
                principalOutstanding: Math.max(0, loan.principalOutstanding - si.amount),
                totalPrincipalPaid: { increment: si.amount }
              }
            });
          }
        }

        // Post financial transaction
        const sysUser = await tx.user.findFirst({
          where: { role: { code: { in: ['SUPER_ADMIN', 'HO_ADMIN', 'BRANCH_MANAGER'] } } }
        });
        const systemMakerId = sysUser ? sysUser.id : (req.user?.id || '');

        await tx.transaction.create({
          data: {
            transactionReference: txnRef,
            transactionType: 'INTERNAL_TRANSFER',
            channel: 'AUTO_E_MANDATE',
            branchId: source.branchId,
            businessDate,
            sourceAccountId: source.id,
            destinationAccountId: si.targetAccountId || null,
            amount: si.amount,
            narration: `Auto-Debit SI Mandate ${si.mandateNumber} to ${si.instructionType}`,
            status: 'POSTED',
            makerUserId: systemMakerId,
            journalLines: {
              create: [
                {
                  glAccountCode: source.product.glAccountCode,
                  glAccountName: `Deposit Liability (${source.product.name})`,
                  entryType: 'DEBIT',
                  amount: si.amount,
                  businessDate,
                  accountId: source.id
                },
                {
                  glAccountCode: targetGlCode,
                  glAccountName: targetGlName,
                  entryType: 'CREDIT',
                  amount: si.amount,
                  businessDate,
                  accountId: si.targetAccountId || null
                }
              ]
            }
          }
        });

        // Advance next execution date by 1 month
        const nextDate = new Date(businessDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        const nextDateStr = nextDate.toISOString().split('T')[0];

        await tx.standingInstruction.update({
          where: { id: si.id },
          data: {
            lastExecutedDate: businessDate,
            nextExecutionDate: nextDateStr,
            failureCount: 0
          }
        });

        await tx.standingInstructionLog.create({
          data: {
            standingInstructionId: si.id,
            executionDate: businessDate,
            amount: si.amount,
            status: 'SUCCESS',
            transactionReference: txnRef
          }
        });

        // Queue Success SMS & WhatsApp
        await tx.notificationLog.create({
          data: {
            recipientPhone: si.customer.phone,
            channel: 'SMS',
            category: 'TRANSACTION',
            templateCode: 'SI_EXECUTION_SUCCESS',
            title: 'Auto-Debit Successful',
            message: `Dear Member, e-Mandate ${si.mandateNumber} of ₹${si.amount} successfully debited from A/c ${source.accountNumber}. Ref: ${txnRef}. Samruddhi Co-op Bank.`,
            status: 'DELIVERED',
            deliveryRef: `SMS-${txnRef}`,
            customerId: si.customerId,
            businessDate
          }
        });
      });

      successCount++;
      executionResults.push({
        mandateNumber: si.mandateNumber,
        status: 'SUCCESS',
        transactionReference: txnRef
      });
    }

    return res.json({
      success: true,
      message: `Standing instructions batch executed for business date ${businessDate}.`,
      summary: {
        totalEvaluated: activeInstructions.length,
        successCount,
        failedCount
      },
      results: executionResults
    });
  } catch (err: any) {
    console.error('SI batch execution error:', err);
    return res.status(500).json({ success: false, message: 'Failed to execute standing instructions batch.' });
  }
}
