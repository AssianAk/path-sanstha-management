import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Co-operative Bank / Pat Sanstha CBS (Phase 1, 2 & 3)...');

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

  // Counter 1
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

  // 4. Business Date
  const todayStr = '2026-09-11';
  await prisma.businessDate.upsert({
    where: { branchId_currentDate: { branchId: b1.id, currentDate: todayStr } },
    update: {},
    create: { branchId: b1.id, currentDate: todayStr, status: 'OPEN' }
  });

  // 5. Users
  const passwordSalt = await bcrypt.genSalt(10);
  const users = [
    { username: 'superadmin', email: 'superadmin@samruddhibank.in', password: 'Admin@123', fullName: 'Shri Vikram Deshmukh', roleCode: 'SUPER_ADMIN', branchId: b1.id },
    { username: 'hoadmin', email: 'hoadmin@samruddhibank.in', password: 'Admin@123', fullName: 'Sunil Rao', roleCode: 'HO_ADMIN', branchId: b1.id },
    { username: 'bm_pune', email: 'bm.pune@samruddhibank.in', password: 'Manager@123', fullName: 'Anand Shinde', roleCode: 'BRANCH_MANAGER', branchId: b1.id },
    { username: 'maker_pune', email: 'maker.pune@samruddhibank.in', password: 'Maker@123', fullName: 'Snehal Joshi (Maker)', roleCode: 'MAKER', branchId: b1.id },
    { username: 'checker_pune', email: 'checker.pune@samruddhibank.in', password: 'Checker@123', fullName: 'Milind Kulkarni (Checker)', roleCode: 'CHECKER', branchId: b1.id },
    { username: 'collector_pune', email: 'collector.pune@samruddhibank.in', password: 'Collector@123', fullName: 'Rajesh Gaikwad (Recovery)', roleCode: 'COLLECTION_OFFICER', branchId: b1.id },
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

  // 7. Customers
  const makerId = userMap.get('maker_pune')!;
  const checkerId = userMap.get('checker_pune')!;
  const bmId = userMap.get('bm_pune')!;

  const member1 = await prisma.customer.upsert({
    where: { customerNumber: 'CUST-2026-00001' },
    update: { status: 'ACTIVE', memberStatus: 'ACTIVE' },
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
      approvedByUserId: checkerId
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
      approvedByUserId: checkerId
    }
  });

  // 8. Deposit Products
  const productsData = [
    { code: 'SB001', name: 'Samruddhi Regular Savings Bank', category: 'SAVINGS', minBalance: 500.0, interestRate: 3.5, compoundingFrequency: 'QUARTERLY', glAccountCode: 'GL-2001' },
    { code: 'CA001', name: 'Samruddhi Business Current Account', category: 'CURRENT', minBalance: 5000.0, interestRate: 0.0, compoundingFrequency: 'NONE', glAccountCode: 'GL-2002' },
    { code: 'FD001', name: 'Samruddhi Term Deposit (FD)', category: 'FIXED_DEPOSIT', minBalance: 10000.0, interestRate: 7.25, compoundingFrequency: 'QUARTERLY', glAccountCode: 'GL-2003' },
    { code: 'RD001', name: 'Lakhpati Recurring Deposit (RD)', category: 'RECURRING_DEPOSIT', minBalance: 1000.0, interestRate: 7.0, compoundingFrequency: 'QUARTERLY', glAccountCode: 'GL-2004' }
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

  // 9. CASA Accounts
  const sbAcc1 = await prisma.account.upsert({
    where: { accountNumber: 'SB-2026-00001' },
    update: { ledgerBalance: 25000.0, availableBalance: 25000.0 },
    create: {
      accountNumber: 'SB-2026-00001',
      customerId: member1.id,
      productId: productMap.get('SB001')!,
      branchId: b1.id,
      ledgerBalance: 25000.0,
      availableBalance: 25000.0,
      status: 'ACTIVE',
      nomineeName: 'Sunita Rajesh Kulkarni',
      nomineeRelation: 'Wife'
    }
  });

  const sbAcc2 = await prisma.account.upsert({
    where: { accountNumber: 'SB-2026-00002' },
    update: { ledgerBalance: 8000.0, availableBalance: 8000.0 },
    create: {
      accountNumber: 'SB-2026-00002',
      customerId: member2.id,
      productId: productMap.get('SB001')!,
      branchId: b1.id,
      ledgerBalance: 8000.0,
      availableBalance: 8000.0,
      status: 'ACTIVE'
    }
  });

  // 10. Teller Till Session
  await prisma.tellerTill.upsert({
    where: { id: 'till-br001-today' },
    update: { currentBalance: 55000.0 },
    create: {
      id: 'till-br001-today',
      branchId: b1.id,
      userId: makerId,
      counterId: counter1.id,
      businessDate: todayStr,
      openingBalance: 25000.0,
      totalCashReceived: 30000.0,
      totalCashPaid: 0.0,
      currentBalance: 55000.0,
      status: 'OPEN'
    }
  });

  // -------------------------------------------------------------
  // 11. PHASE 3: LOAN PRODUCTS SEEDING (SECTIONS 10 & 20)
  // -------------------------------------------------------------
  const loanProductsData = [
    {
      code: 'BL001',
      name: 'Samruddhi Vyapar SME Term Loan',
      category: 'BUSINESS',
      description: 'Collateral-backed working capital and equipment finance for businesses',
      interestRate: 11.0,
      interestType: 'REDUCING_BALANCE',
      minAmount: 50000.0,
      maxAmount: 2500000.0,
      minTenureMonths: 12,
      maxTenureMonths: 84,
      processingFeePercent: 1.0,
      glAssetCode: 'GL-1002',
      glIncomeCode: 'GL-4001'
    },
    {
      code: 'PL001',
      name: 'Samruddhi Personal Loan',
      category: 'PERSONAL',
      description: 'Quick clean personal loan for medical, travel, and festive needs',
      interestRate: 12.5,
      interestType: 'REDUCING_BALANCE',
      minAmount: 20000.0,
      maxAmount: 500000.0,
      minTenureMonths: 6,
      maxTenureMonths: 60,
      processingFeePercent: 1.5,
      glAssetCode: 'GL-1002',
      glIncomeCode: 'GL-4001'
    },
    {
      code: 'GL001',
      name: 'Swarna Samruddhi Gold Loan',
      category: 'GOLD',
      description: 'Instant loan against gold jewelry with high per-gram valuation',
      interestRate: 9.5,
      interestType: 'REDUCING_BALANCE',
      minAmount: 10000.0,
      maxAmount: 1000000.0,
      minTenureMonths: 3,
      maxTenureMonths: 24,
      processingFeePercent: 0.5,
      glAssetCode: 'GL-1002',
      glIncomeCode: 'GL-4001'
    },
    {
      code: 'AG001',
      name: 'Kisan Krishi Vikas Term Loan',
      category: 'AGRICULTURAL',
      description: 'Subsidized term finance for irrigation, tractors, and agricultural development',
      interestRate: 7.0,
      interestType: 'REDUCING_BALANCE',
      minAmount: 25000.0,
      maxAmount: 1500000.0,
      minTenureMonths: 12,
      maxTenureMonths: 60,
      processingFeePercent: 0.5,
      glAssetCode: 'GL-1002',
      glIncomeCode: 'GL-4001'
    }
  ];

  const loanProdMap = new Map<string, string>();
  for (const lp of loanProductsData) {
    const prod = await prisma.loanProduct.upsert({
      where: { code: lp.code },
      update: { name: lp.name, interestRate: lp.interestRate },
      create: lp
    });
    loanProdMap.set(lp.code, prod.id);
  }
  console.log(`✓ Seeded ${loanProductsData.length} Loan Products (Business, Personal, Gold, Agri)`);

  // -------------------------------------------------------------
  // 12. PHASE 3: SAMPLE LOAN APPLICATION & DISBURSED LOAN ACCOUNT
  // -------------------------------------------------------------
  // Application for Rajesh Kulkarni: ₹300,000 Business Term Loan (BL001)
  const app1 = await prisma.loanApplication.upsert({
    where: { applicationNumber: 'LA-2026-00001' },
    update: {},
    create: {
      applicationNumber: 'LA-2026-00001',
      customerId: member1.id,
      loanProductId: loanProdMap.get('BL001')!,
      branchId: b1.id,
      requestedAmount: 300000.0,
      requestedTenureMonths: 24,
      purpose: 'Wholesale agricultural warehouse expansion and inventory',
      status: 'DISBURSED',
      riskGrade: 'GRADE_A',
      appraisalNotes: 'Established borrower with solid banking turnover and clear property security. Low credit risk.',
      sanctionedAmount: 300000.0,
      sanctionedTenureMonths: 24,
      interestRate: 11.0,
      sanctionedAt: new Date('2026-09-10'),
      sanctionedByUserId: bmId,
      guarantors: {
        create: [
          {
            name: 'Mahesh Suresh Kulkarni',
            relationship: 'Brother',
            phone: '9822099887',
            pan: 'ABCDE9999M',
            occupation: 'Government Officer',
            netWorth: 2500000.0
          }
        ]
      },
      collaterals: {
        create: [
          {
            collateralType: 'PROPERTY',
            description: 'Commercial Shop No. 4, Market Yard, Pune',
            marketValue: 1200000.0,
            assessedValue: 900000.0,
            documentRef: 'DOC-REG-PUNE-2021-9871'
          }
        ]
      }
    }
  });

  // Calculate reducing balance EMI for ₹300,000 @ 11.0% for 24 months
  // P = 300000, r = 0.11 / 12 = 0.00916667, n = 24
  // EMI = 300000 * 0.00916667 * (1.00916667)^24 / ((1.00916667)^24 - 1) = ₹13,986.08
  const emiVal = 13986.0;

  const loanAcc1 = await prisma.loanAccount.upsert({
    where: { loanAccountNumber: 'LN-2026-00001' },
    update: {},
    create: {
      loanAccountNumber: 'LN-2026-00001',
      loanApplicationId: app1.id,
      customerId: member1.id,
      loanProductId: loanProdMap.get('BL001')!,
      branchId: b1.id,
      sanctionedAmount: 300000.0,
      disbursedAmount: 300000.0,
      principalOutstanding: 300000.0,
      interestRate: 11.0,
      interestType: 'REDUCING_BALANCE',
      tenureMonths: 24,
      emiAmount: emiVal,
      disbursementDate: todayStr,
      firstEmiDate: '2026-10-11',
      maturityDate: '2028-09-11',
      status: 'ACTIVE',
      savingsAccountId: sbAcc1.id
    }
  });

  // Generate 24 installments for LN-2026-00001
  const existingInsts = await prisma.loanInstallment.count({ where: { loanAccountId: loanAcc1.id } });
  if (existingInsts === 0) {
    let balance = 300000.0;
    const monthlyRate = 0.11 / 12;

    for (let i = 1; i <= 24; i++) {
      const interestDue = Math.round(balance * monthlyRate * 100) / 100;
      const principalDue = Math.round((emiVal - interestDue) * 100) / 100;
      balance = Math.max(0, balance - principalDue);

      const d = new Date('2026-09-11');
      d.setMonth(d.getMonth() + i);
      const dueDateStr = d.toISOString().split('T')[0];

      await prisma.loanInstallment.create({
        data: {
          loanAccountId: loanAcc1.id,
          installmentNumber: i,
          dueDate: dueDateStr,
          principalDue,
          interestDue,
          totalEmi: emiVal,
          status: 'PENDING'
        }
      });
    }
  }

  // Initial Loan Disbursement Transaction
  const disbTxn = await prisma.transaction.upsert({
    where: { transactionReference: 'TXN-20260911-00002' },
    update: {},
    create: {
      transactionReference: 'TXN-20260911-00002',
      transactionType: 'LOAN_DISBURSEMENT',
      channel: 'BRANCH_TELLER',
      branchId: b1.id,
      businessDate: todayStr,
      destinationAccountId: sbAcc1.id,
      amount: 300000.0,
      currency: 'INR',
      narration: `Disbursement of SME Business Loan ${loanAcc1.loanAccountNumber} to Savings Account`,
      status: 'POSTED',
      makerUserId: makerId,
      checkerUserId: bmId,
      journalLines: {
        create: [
          {
            glAccountCode: 'GL-1002',
            glAccountName: 'Loan Asset (Principal Outstanding)',
            entryType: 'DEBIT',
            amount: 300000.0,
            businessDate: todayStr
          },
          {
            glAccountCode: 'GL-2001',
            glAccountName: 'Customer Savings Account Liability',
            entryType: 'CREDIT',
            amount: 297000.0,
            businessDate: todayStr,
            accountId: sbAcc1.id
          },
          {
            glAccountCode: 'GL-4001',
            glAccountName: 'Loan Processing Fee Income (1%)',
            entryType: 'CREDIT',
            amount: 3000.0,
            businessDate: todayStr
          }
        ]
      }
    }
  });

  console.log(`✓ Seeded Disbursed Loan: ${loanAcc1.loanAccountNumber} with 24 EMI Schedule (EMI: ₹${emiVal})`);
  console.log(`✓ Seeded Balanced Disbursement Txn: ${disbTxn.transactionReference} (Total Debits: ₹300k == Total Credits: ₹300k)`);

  // 14. Phase 4: Delinquent Loan (NPA / SMA demonstration)
  const collectorId = userMap.get('collector_pune')!;
  const plProduct = await prisma.loanProduct.findUnique({ where: { code: 'PL001' } });

  if (plProduct) {
    const overdueLoanApp = await prisma.loanApplication.upsert({
      where: { applicationNumber: 'LA-2026-00099' },
      update: {},
      create: {
        applicationNumber: 'LA-2026-00099',
        customerId: member2.id,
        loanProductId: plProduct.id,
        branchId: b1.id,
        requestedAmount: 150000.0,
        requestedTenureMonths: 12,
        purpose: 'Retail Boutique Expansion',
        status: 'DISBURSED',
        riskGrade: 'MEDIUM',
        appraisalNotes: 'Appraised in April 2026. Approved by branch committee.',
        sanctionedAmount: 150000.0,
        interestRate: 12.5,
        sanctionedTenureMonths: 12,
        sanctionedByUserId: bmId,
        sanctionedAt: new Date('2026-04-10')
      }
    });

    const emiOverdue = 13362.43; // 150k @ 12.5% for 12 months
    const overdueLoanAcc = await prisma.loanAccount.upsert({
      where: { loanAccountNumber: 'LN-2026-00099' },
      update: {
        dpd: 92,
        assetClassification: 'SUB_STANDARD',
        npaDate: '2026-09-09',
        provisionPercent: 10.0,
        provisionAmount: 11450.0,
        assignedCollectorId: collectorId
      },
      create: {
        loanAccountNumber: 'LN-2026-00099',
        loanApplicationId: overdueLoanApp.id,
        customerId: member2.id,
        loanProductId: plProduct.id,
        branchId: b1.id,
        sanctionedAmount: 150000.0,
        disbursedAmount: 150000.0,
        principalOutstanding: 114500.0,
        interestRate: 12.5,
        interestType: 'REDUCING_BALANCE',
        tenureMonths: 12,
        emiAmount: emiOverdue,
        disbursementDate: '2026-04-11',
        firstEmiDate: '2026-05-11',
        maturityDate: '2027-04-11',
        status: 'OVERDUE',
        dpd: 92,
        assetClassification: 'SUB_STANDARD',
        npaDate: '2026-09-09',
        provisionPercent: 10.0,
        provisionAmount: 11450.0,
        assignedCollectorId: collectorId,
        totalInterestPaid: 3200.0,
        totalPrincipalPaid: 35500.0,
        totalPenaltyPaid: 0.0
      }
    });

    // Check if installments exist
    const instCount = await prisma.loanInstallment.count({ where: { loanAccountId: overdueLoanAcc.id } });
    if (instCount === 0) {
      // Month 1: 2026-05-11 (PAID)
      await prisma.loanInstallment.create({
        data: {
          loanAccountId: overdueLoanAcc.id,
          installmentNumber: 1,
          dueDate: '2026-05-11',
          principalDue: 11800.0,
          interestDue: 1562.43,
          totalEmi: emiOverdue,
          principalPaid: 11800.0,
          interestPaid: 1562.43,
          status: 'PAID',
          paidDate: '2026-05-10'
        }
      });
      // Month 2: 2026-06-11 (OVERDUE - 92 DPD)
      await prisma.loanInstallment.create({
        data: {
          loanAccountId: overdueLoanAcc.id,
          installmentNumber: 2,
          dueDate: '2026-06-11',
          principalDue: 11923.0,
          interestDue: 1439.43,
          totalEmi: emiOverdue,
          penaltyDue: 500.0,
          status: 'OVERDUE'
        }
      });
      // Month 3: 2026-07-11 (OVERDUE - 62 DPD)
      await prisma.loanInstallment.create({
        data: {
          loanAccountId: overdueLoanAcc.id,
          installmentNumber: 3,
          dueDate: '2026-07-11',
          principalDue: 12047.0,
          interestDue: 1315.43,
          totalEmi: emiOverdue,
          penaltyDue: 500.0,
          status: 'OVERDUE'
        }
      });
      // Month 4: 2026-08-11 (OVERDUE - 31 DPD)
      await prisma.loanInstallment.create({
        data: {
          loanAccountId: overdueLoanAcc.id,
          installmentNumber: 4,
          dueDate: '2026-08-11',
          principalDue: 12172.0,
          interestDue: 1190.43,
          totalEmi: emiOverdue,
          penaltyDue: 500.0,
          status: 'OVERDUE'
        }
      });
      // Month 5: 2026-09-11 (OVERDUE - 0 DPD / Today)
      await prisma.loanInstallment.create({
        data: {
          loanAccountId: overdueLoanAcc.id,
          installmentNumber: 5,
          dueDate: '2026-09-11',
          principalDue: 12299.0,
          interestDue: 1063.43,
          totalEmi: emiOverdue,
          penaltyDue: 0.0,
          status: 'OVERDUE'
        }
      });
    }

    // Seed Sample Recovery Action
    const recCount = await prisma.loanRecoveryAction.count({ where: { loanAccountId: overdueLoanAcc.id } });
    if (recCount === 0) {
      await prisma.loanRecoveryAction.create({
        data: {
          loanAccountId: overdueLoanAcc.id,
          collectorId,
          actionType: 'FIELD_VISIT',
          actionDate: '2026-09-08',
          customerResponse: 'WILL_PAY',
          promisedPaymentDate: '2026-09-15',
          promisedAmount: 25000.0,
          notes: 'Visited borrower boutique at Shivaji Nagar. Borrower requested time until 15th Sep to clear 2 EMIs.',
          followUpDate: '2026-09-16',
          businessDate: todayStr
        }
      });
    }

    // Seed Sample Notice
    await prisma.loanNotice.upsert({
      where: { noticeNumber: 'NOT-2026-00001' },
      update: {},
      create: {
        noticeNumber: 'NOT-2026-00001',
        loanAccountId: overdueLoanAcc.id,
        noticeType: 'DEMAND_2',
        generatedDate: '2026-08-15',
        dueAmount: 28280.0,
        principalOverdue: 23970.0,
        interestOverdue: 2755.0,
        penalCharges: 1000.0,
        dispatchMedium: 'REGISTERED_POST',
        dispatchRef: 'RPAD-MH-99210041',
        dispatchedDate: '2026-08-16',
        deliveryStatus: 'DELIVERED',
        deliveredDate: '2026-08-18',
        generatedByUserId: collectorId,
        businessDate: todayStr,
        content: 'Formal Demand Notice under Bank Bye-laws warning of NPA classification and legal recovery certificate.'
      }
    });

    console.log(`✓ Seeded Delinquent Loan: ${overdueLoanAcc.loanAccountNumber} (DPD: 92, Asset Class: SUB_STANDARD, Assigned to Rajesh Gaikwad)`);
    console.log(`✓ Seeded Phase 4 Recovery Action & Demand Notice (NOT-2026-00001)`);
  }

  console.log('🎉 Seed complete successfully for Phase 1, 2, 3 & 4!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
