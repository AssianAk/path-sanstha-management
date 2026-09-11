import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Co-operative Bank / Pat Sanstha CBS...');

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

  // 4. Business Date for Branches (controlled business date)
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
  console.log(`✓ Seeded Business Date (${todayStr}) for Branches`);

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
  console.log(`✓ Seeded ${settings.length} System Settings`);

  // 7. Seed Sample Active Member Customer
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
            line2: 'Near Grampanchayat Road',
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
            dob: '1988-11-04',
            age: 38,
            phone: '9822098765',
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
          },
          {
            documentType: 'AADHAAR',
            documentNumber: 'XXXXXXXX4589',
            version: 1,
            status: 'VERIFIED',
            verifiedByUserId: checkerId,
            verifiedAt: new Date(),
            verificationRemarks: 'UIDAI offline paperless e-KYC verified.'
          }
        ]
      }
    }
  });

  // 8. Seed Customer Pending Checker Approval (for immediate testing in UI)
  const pendingCustomer = await prisma.customer.upsert({
    where: { customerNumber: 'CUST-2026-00002' },
    update: {},
    create: {
      customerNumber: 'CUST-2026-00002',
      customerType: 'INDIVIDUAL',
      isMember: true,
      memberNumber: 'MEM-2026-00002',
      membershipDate: new Date('2026-09-10'),
      memberStatus: 'DORMANT',
      title: 'Smt',
      firstName: 'Priya',
      middleName: 'Ramesh',
      lastName: 'Patil',
      dob: '1992-09-15',
      gender: 'FEMALE',
      maritalStatus: 'MARRIED',
      fatherOrSpouseName: 'Ramesh Patil',
      occupation: 'Small Business / Retail',
      annualIncome: 480000,
      pan: 'BNYPP9876K',
      aadhaarLast4: '7721',
      phone: '9890123456',
      email: 'priya.patil@example.com',
      branchId: b1.id,
      riskCategory: 'LOW',
      status: 'PENDING_KYC',
      createdByUserId: makerId,
      addresses: {
        create: [
          {
            addressType: 'CURRENT',
            line1: 'Flat 402, Shreeram Residency',
            line2: 'Karve Road',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411038',
            isPrimary: true
          }
        ]
      },
      nominees: {
        create: [
          {
            name: 'Aarav Ramesh Patil',
            relationship: 'Son',
            age: 8,
            allocationPercentage: 100.0,
            isMinor: true,
            guardianName: 'Ramesh Patil',
            guardianRelation: 'Father'
          }
        ]
      },
      kycDocuments: {
        create: [
          {
            documentType: 'PAN',
            documentNumber: 'BNYPP9876K',
            version: 1,
            status: 'PENDING',
            verificationRemarks: 'Submitted by Maker for PAN verification'
          },
          {
            documentType: 'AADHAAR',
            documentNumber: 'XXXXXXXX7721',
            version: 1,
            status: 'PENDING',
            verificationRemarks: 'Submitted by Maker for Address Proof'
          }
        ]
      }
    }
  });

  // Create Approval Queue item for Priya Patil
  const existingQueue = await prisma.approvalQueue.findFirst({
    where: { entityId: pendingCustomer.id, status: 'PENDING' }
  });

  if (!existingQueue) {
    await prisma.approvalQueue.create({
      data: {
        module: 'KYC',
        entityId: pendingCustomer.id,
        actionType: 'VERIFY',
        payloadJson: JSON.stringify({
          customerId: pendingCustomer.id,
          customerName: 'Priya Ramesh Patil',
          customerNumber: pendingCustomer.customerNumber,
          memberNumber: pendingCustomer.memberNumber,
          riskCategory: 'LOW',
          documents: ['PAN: BNYPP9876K', 'AADHAAR: XXXXXXXX7721']
        }),
        status: 'PENDING',
        makerUserId: makerId,
        makerRemarks: 'Documents checked and uploaded. Ready for Checker verification.',
        branchId: b1.id
      }
    });
  }

  // 9. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: userMap.get('superadmin'),
      username: 'superadmin',
      userRole: 'SUPER_ADMIN',
      branchId: b1.id,
      action: 'CREATE',
      entityName: 'SYSTEM_INITIALIZATION',
      entityId: org.id,
      afterStateJson: JSON.stringify({ message: 'Co-operative Bank CBS Phase 1 initialized and seeded.' }),
      businessDate: todayStr,
      ipAddress: '127.0.0.1',
      userAgent: 'System Seed CLI'
    }
  });

  console.log(`✓ Sample Member Created: ${member1.customerNumber} (${member1.firstName} ${member1.lastName})`);
  console.log(`✓ Pending KYC Member Created: ${pendingCustomer.customerNumber} (${pendingCustomer.firstName} ${pendingCustomer.lastName}) in ApprovalQueue`);
  console.log('🎉 Seed complete successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
