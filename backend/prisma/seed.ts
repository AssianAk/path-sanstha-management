import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Co-operative Bank / Pat Sanstha CBS (Phase 1 & 2)...');

  // 1. Roles
  const rolesData = [
    { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Complete system access and tenant administration' },
    { code: 'HO_ADMIN', name: 'Head Office Administrator', description: 'Product, policy, masters, and branch management' },
    { code: 'BRANCH_MANAGER', name: 'Branch Manager', description: 'Branch oversight, authorizer, and business date controls' },
    { code: 'MAKER', name: 'Maker / Operator', description: 'Data entry operator for customers, accounts, and transactions' },
    { code: 'CHECKER', name: 'Checker / Authorizer', description: 'Verification and authorization officer for Maker tasks' },
    { code: 'TELLER', name: 'Teller / Cashier', description: 'Front-desk cash handling and counter balancing' },
    { code: 'LOAN_OFFICER', name: 'Loan Officer', description: 'Loan appraisal, credit verification, and servicing' },
    { code: 'COLLECTION_OFFICER', name: 'Collection Officer', description: 'Overdue tracking and field recovery' },
    { code: 'ACCOUNTANT', name: 'Accountant', description: 'General ledger, journal postings, and reconciliations' },
    { code: 'AUDITOR', name: 'Internal Auditor', description: 'Read-only audit trails, logs, and compliance checking' },
    { code: 'CUSTOMER', name: 'Customer / Member', description: 'Self-service banking access' }
  ];

  const rolesMap = new Map<string, string>();
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: r
    });
    rolesMap.set(r.code, role.id);
  }
  console.log(`✓ Seeded ${rolesData.length} Roles`);

  // 2. Organization
  const org = await prisma.organization.upsert({
    where: { registrationNumber: 'COOP/MAH/2026/0491' },
    update: {},
    create: {
      name: 'Samruddhi Co-operative Urban Bank Ltd.',
      registrationNumber: 'COOP/MAH/2026/0491',
      headOfficeAddress: 'Samruddhi Bhavan, Senapati Bapat Road, Pune, Maharashtra 411016',
      contactEmail: 'contact@samruddhibank.in',
      contactPhone: '+91 20 2567 8900',
      panNumber: 'AABCS1234F',
      gstNumber: '27AABCS1234F1Z5',
      establishedDate: new Date('1998-04-14')
    }
  });
  console.log(`✓ Seeded Organization: ${org.name}`);

  // 3. Branches
  const b1 = await prisma.branch.upsert({
    where: { code: 'BR001' },
    update: {},
    create: {
      organizationId: org.id,
      code: 'BR001',
      name: 'Head Office & Main Branch - Pune',
      ifscCode: 'SMRB0000001',
      micrCode: '411099001',
      address: '101, Samruddhi Bhavan, Senapati Bapat Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411016',
      phone: '+91 20 2567 8901',
      email: 'ho.pune@samruddhibank.in'
    }
  });

  const b2 = await prisma.branch.upsert({
    where: { code: 'BR002' },
    update: {},
    create: {
      organizationId: org.id,
      code: 'BR002',
      name: 'Shivaji Nagar Branch',
      ifscCode: 'SMRB0000002',
      micrCode: '411099002',
      address: '42/B, F.C. Road, Shivaji Nagar',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411005',
      phone: '+91 20 2553 4411',
      email: 'shivajinagar@samruddhibank.in'
    }
  });

  const b3 = await prisma.branch.upsert({
    where: { code: 'BR003' },
    update: {},
    create: {
      organizationId: org.id,
      code: 'BR003',
      name: 'Thane West Branch',
      ifscCode: 'SMRB0000003',
      micrCode: '400099003',
      address: 'Shop 12-14, Lake City Mall, Kapurbawdi',
      city: 'Thane',
      state: 'Maharashtra',
      pincode: '400607',
      phone: '+91 22 2544 9012',
      email: 'thane@samruddhibank.in'
    }
  });
  console.log('✓ Seeded Branches: BR001, BR002, BR003');

  // Counters for BR001
  const counter1 = await prisma.branchCounter.upsert({
    where: { id: 'cntr-001' },
    update: {},
    create: {
      id: 'cntr-001',
      branchId: b1.id,
      counterNumber: 'C-01',
      counterName: 'Cash Counter 1 (Teller)',
      isActive: true
    }
  });

  // 4. Business Date for Branches
  const todayStr = '2026-09-11';
  await prisma.businessDate.upsert({
    where: { branchId_currentDate: { branchId: b1.id, currentDate: todayStr } },
    update: {},
    create: { branchId: b1.id, currentDate: todayStr, status: 'OPEN' }
  });
  await prisma.businessDate.upsert({
    where: { branchId_currentDate: { branchId: b2.id, currentDate: todayStr } },
    update: {},
    create: { branchId: b2.id, currentDate: todayStr, status: 'OPEN' }
  });
  await prisma.businessDate.upsert({
    where: { branchId_currentDate: { branchId: b3.id, currentDate: todayStr } },
    update: {},
    create: { branchId: b3.id, currentDate: todayStr, status: 'OPEN' }
  });

  // 5. Users
  const passwordSalt = await bcrypt.genSalt(10);
  const users = [
    { username: 'superadmin', email: 'superadmin@samruddhibank.in', password: 'Admin@123', fullName: 'Shri Vikram Deshmukh', roleCode: 'SUPER_ADMIN', branchId: b1.id },
    { username: 'hoadmin', email: 'hoadmin@samruddhibank.in', password: 'Admin@123', fullName: 'Sunil Rao', roleCode: 'HO_ADMIN', branchId: b1.id },
    { username: 'bm_pune', email: 'bm.pune@samruddhibank.in', password: 'Manager@123', fullName: 'Anand Shinde', roleCode: 'BRANCH_MANAGER', branchId: b1.id },
    { username: 'maker_pune', email: 'maker.pune@samruddhibank.in', password: 'Maker@123', fullName: 'Snehal Joshi (Maker)', roleCode: 'MAKER', branchId: b1.id },
    { username: 'checker_pune', email: 'checker.pune@samruddhibank.in', password: 'Checker@123', fullName: 'Milind Kulkarni (Checker)', roleCode: 'CHECKER', branchId: b1.id },
    { username: 'auditor', email: 'auditor@samruddhibank.in', password: 'Auditor@123', fullName: 'Pradeep Walvekar (Auditor)', roleCode: 'AUDITOR', branchId: b1.id }
  ];

  const userMap = new Map<string, string>();
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, passwordSalt);
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { fullName: u.fullName, roleId: rolesMap.get(u.roleCode)!, branchId: u.branchId },
      create: {
        username: u.username,
        email: u.email,
        passwordHash: hash,
        fullName: u.fullName,
        roleId: rolesMap.get(u.roleCode)!,
        branchId: u.branchId,
        isActive: true
      }
    });
    userMap.set(u.username, user.id);
  }
  console.log(`✓ Seeded ${users.length} Users with credentials`);

  // 6. System Settings
  const settings = [
    { key: 'BANK_NAME', value: 'Samruddhi Co-operative Urban Bank Ltd.', description: 'Official Legal Bank / Pat Sanstha Name', category: 'GENERAL' },
    { key: 'KYC_MAKER_CHECKER_REQUIRED', value: 'true', description: 'Require Checker approval for all KYC activations', category: 'MAKER_CHECKER' },
    { key: 'MEMBER_SHARE_DEFAULT_FACE_VALUE', value: '10.0', description: 'Nominal share face value in INR', category: 'GENERAL' },
    { key: 'MIN_SHARES_FOR_MEMBERSHIP', value: '10', description: 'Minimum number of shares required to be a voting member', category: 'GENERAL' },
    { key: 'BUSINESS_DATE_MODE', value: 'STRICT_BRANCH_EOD', description: 'Transactions must match active branch business date', category: 'EOD' }
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s
    });
  }

  // 7. Seed Sample Customers
  const makerId = userMap.get('maker_pune')!;
  const checkerId = userMap.get('checker_pune')!;

  const member1 = await prisma.customer.upsert({
    where: { customerNumber: 'CUST-2026-00001' },
    update: {},
    create: {
      customerNumber: 'CUST-2026-00001',
      customerType: 'INDIVIDUAL',
      isMember: true,
      memberNumber: 'MEM-2026-00001',
      membershipDate: new Date('2026-01-15'),
      memberStatus: 'ACTIVE',
      title: 'Shri',
      firstName: 'Rajesh',
      middleName: 'Suresh',
      lastName: 'Kulkarni',
      dob: '1984-06-21',
      gender: 'MALE',
      maritalStatus: 'MARRIED',
      fatherOrSpouseName: 'Suresh Kulkarni',
      occupation: 'Agricultural Trader',
      annualIncome: 750000,
      pan: 'ABCDE1234F',
      aadhaarLast4: '4589',
      phone: '9822012345',
      email: 'rajesh.kulkarni@example.com',
      branchId: b1.id,
      riskCategory: 'LOW',
      status: 'ACTIVE',
      createdByUserId: makerId,
      approvedByUserId: checkerId,
      addresses: {
        create: [
          {
            addressType: 'PERMANENT',
            line1: 'Bungalow 14, Sahakar Colony',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411016',
            isPrimary: true
          }
        ]
      },
      nominees: {
        create: [
          {
            name: 'Sunita Rajesh Kulkarni',
            relationship: 'Wife',
            age: 38,
            allocationPercentage: 100.0,
            isMinor: false
          }
        ]
      },
      memberShares: {
        create: [
          {
            shareCertificateNumber: 'CERT-2026-00142',
            distinctFrom: 14201,
            distinctTo: 14300,
            totalShares: 100,
            faceValue: 10.0,
            totalAmount: 1000.0,
            status: 'ACTIVE'
          }
        ]
      },
      kycDocuments: {
        create: [
          {
            documentType: 'PAN',
            documentNumber: 'ABCDE1234F',
            version: 1,
            status: 'VERIFIED',
            verifiedByUserId: checkerId,
            verifiedAt: new Date(),
            verificationRemarks: 'PAN verified with Income Tax NSDL database match.'
          }
        ]
      }
    }
  });

  const member2 = await prisma.customer.upsert({
    where: { customerNumber: 'CUST-2026-00002' },
    update: { status: 'ACTIVE', memberStatus: 'ACTIVE' },
    create: {
      customerNumber: 'CUST-2026-00002',
      customerType: 'INDIVIDUAL',
      isMember: true,
      memberNumber: 'MEM-2026-00002',
      membershipDate: new Date('2026-09-10'),
      memberStatus: 'ACTIVE',
      title: 'Smt',
      firstName: 'Priya',
      middleName: 'Ramesh',
      lastName: 'Patil',
      dob: '1992-09-15',
      gender: 'FEMALE',
      maritalStatus: 'MARRIED',
      fatherOrSpouseName: 'Ramesh Patil',
      occupation: 'Retail Entrepreneur',
      annualIncome: 480000,
      pan: 'BNYPP9876K',
      aadhaarLast4: '7721',
      phone: '9890123456',
      email: 'priya.patil@example.com',
      branchId: b1.id,
      riskCategory: 'LOW',
      status: 'ACTIVE',
      createdByUserId: makerId,
      approvedByUserId: checkerId,
      addresses: {
        create: [
          {
            addressType: 'CURRENT',
            line1: 'Flat 402, Shreeram Residency',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411038',
            isPrimary: true
          }
        ]
      }
    }
  });

  // -------------------------------------------------------------
  // 8. PHASE 2: PRODUCTS SEEDING (SAVINGS, CURRENT, FD, RD)
  // -------------------------------------------------------------
  const productsData = [
    {
      code: 'SB001',
      name: 'Samruddhi Regular Savings Bank',
      category: 'SAVINGS',
      description: 'Standard liquid deposit account with quarterly interest payout',
      minBalance: 500.0,
      interestRate: 3.5,
      compoundingFrequency: 'QUARTERLY',
      tenureMinMonths: 0,
      tenureMaxMonths: 0,
      glAccountCode: 'GL-2001',
      isActive: true
    },
    {
      code: 'CA001',
      name: 'Samruddhi Business Current Account',
      category: 'CURRENT',
      description: 'Operational business checking account with high transaction limits',
      minBalance: 5000.0,
      interestRate: 0.0,
      compoundingFrequency: 'NONE',
      tenureMinMonths: 0,
      tenureMaxMonths: 0,
      glAccountCode: 'GL-2002',
      isActive: true
    },
    {
      code: 'FD001',
      name: 'Samruddhi Term Deposit (FD)',
      category: 'FIXED_DEPOSIT',
      description: 'High return fixed term deposit with compounding interest',
      minBalance: 10000.0,
      interestRate: 7.25,
      compoundingFrequency: 'QUARTERLY',
      tenureMinMonths: 6,
      tenureMaxMonths: 120,
      prematurePenaltyRate: 1.0,
      glAccountCode: 'GL-2003',
      isActive: true
    },
    {
      code: 'RD001',
      name: 'Lakhpati Recurring Deposit (RD)',
      category: 'RECURRING_DEPOSIT',
      description: 'Monthly disciplined savings scheme with cumulative interest',
      minBalance: 1000.0,
      interestRate: 7.0,
      compoundingFrequency: 'QUARTERLY',
      tenureMinMonths: 12,
      tenureMaxMonths: 120,
      prematurePenaltyRate: 1.0,
      glAccountCode: 'GL-2004',
      isActive: true
    }
  ];

  const productMap = new Map<string, string>();
  for (const p of productsData) {
    const prod = await prisma.product.upsert({
      where: { code: p.code },
      update: { name: p.name, interestRate: p.interestRate, minBalance: p.minBalance },
      create: p
    });
    productMap.set(p.code, prod.id);
  }
  console.log(`✓ Seeded ${productsData.length} Deposit Products (SB, CA, FD, RD)`);

  // -------------------------------------------------------------
  // 9. PHASE 2: SEED ACTIVE ACCOUNTS
  // -------------------------------------------------------------
  // Account 1: Rajesh Kulkarni Savings Account
  const sbAcc1 = await prisma.account.upsert({
    where: { accountNumber: 'SB-2026-00001' },
    update: {},
    create: {
      accountNumber: 'SB-2026-00001',
      customerId: member1.id,
      productId: productMap.get('SB001')!,
      branchId: b1.id,
      currency: 'INR',
      ledgerBalance: 15000.0,
      availableBalance: 15000.0,
      status: 'ACTIVE',
      nomineeName: 'Sunita Rajesh Kulkarni',
      nomineeRelation: 'Wife'
    }
  });

  // Account 2: Rajesh Kulkarni Fixed Deposit
  const fdAcc1 = await prisma.account.upsert({
    where: { accountNumber: 'FD-2026-00001' },
    update: {},
    create: {
      accountNumber: 'FD-2026-00001',
      customerId: member1.id,
      productId: productMap.get('FD001')!,
      branchId: b1.id,
      currency: 'INR',
      ledgerBalance: 100000.0,
      availableBalance: 0.0, // Term deposits have available balance 0 until liquidated
      status: 'ACTIVE',
      nomineeName: 'Sunita Rajesh Kulkarni',
      nomineeRelation: 'Wife',
      termDepositDetail: {
        create: {
          depositAmount: 100000.0,
          tenureMonths: 12,
          interestRate: 7.25,
          maturityDate: '2027-09-11',
          maturityAmount: 107450.0,
          payoutType: 'ON_MATURITY',
          autoRenewal: true
        }
      }
    }
  });

  // Account 3: Priya Patil Savings Account
  const sbAcc2 = await prisma.account.upsert({
    where: { accountNumber: 'SB-2026-00002' },
    update: {},
    create: {
      accountNumber: 'SB-2026-00002',
      customerId: member2.id,
      productId: productMap.get('SB001')!,
      branchId: b1.id,
      currency: 'INR',
      ledgerBalance: 5000.0,
      availableBalance: 5000.0,
      status: 'ACTIVE',
      nomineeName: 'Aarav Ramesh Patil',
      nomineeRelation: 'Son'
    }
  });
  console.log('✓ Seeded Accounts: SB-2026-00001, FD-2026-00001, SB-2026-00002');

  // -------------------------------------------------------------
  // 10. PHASE 2: TELLER TILL SESSION (BR001)
  // -------------------------------------------------------------
  const tellerUser = await prisma.user.findUnique({ where: { username: 'maker_pune' } });
  const till = await prisma.tellerTill.upsert({
    where: { id: 'till-br001-today' },
    update: {},
    create: {
      id: 'till-br001-today',
      branchId: b1.id,
      userId: tellerUser!.id,
      counterId: counter1.id,
      businessDate: todayStr,
      openingBalance: 25000.0,
      totalCashReceived: 15000.0,
      totalCashPaid: 0.0,
      currentBalance: 40000.0,
      status: 'OPEN'
    }
  });
  console.log(`✓ Seeded Active Teller Till for Counter ${counter1.counterNumber}`);

  // -------------------------------------------------------------
  // 11. INITIAL BALANCED FINANCIAL TRANSACTION (Section 21 Pattern)
  // -------------------------------------------------------------
  const initialTxn = await prisma.transaction.upsert({
    where: { transactionReference: 'TXN-20260911-00001' },
    update: {},
    create: {
      transactionReference: 'TXN-20260911-00001',
      transactionType: 'CASH_DEPOSIT',
      channel: 'BRANCH_TELLER',
      branchId: b1.id,
      businessDate: todayStr,
      destinationAccountId: sbAcc1.id,
      amount: 15000.0,
      currency: 'INR',
      narration: 'Initial cash deposit at account opening',
      status: 'POSTED',
      makerUserId: makerId,
      checkerUserId: checkerId,
      tellerTillId: till.id,
      denomination: {
        create: {
          note500: 30,
          totalAmount: 15000.0
        }
      },
      journalLines: {
        create: [
          {
            glAccountCode: 'GL-1001',
            glAccountName: 'Cash in Hand / Branch Vault',
            entryType: 'DEBIT',
            amount: 15000.0,
            businessDate: todayStr
          },
          {
            glAccountCode: 'GL-2001',
            glAccountName: 'Customer Deposit Liability (Savings)',
            entryType: 'CREDIT',
            amount: 15000.0,
            businessDate: todayStr,
            accountId: sbAcc1.id
          }
        ]
      }
    }
  });
  console.log(`✓ Seeded Balanced Financial Transaction: ${initialTxn.transactionReference} (Total Debits == Total Credits = ₹15,000)`);

  console.log('🎉 Seed complete successfully for Phase 1 & 2!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
