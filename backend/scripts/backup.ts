import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runBackup() {
  console.log('================================================================');
  console.log('🏦 CO-OPERATIVE BANK / PAT SANSTHA CBS - DISASTER RECOVERY');
  console.log('📦 Automated Hot/Cold Database Backup Routine');
  console.log('================================================================\n');

  const prismaDir = path.join(__dirname, '..', 'prisma');
  const dbPath = path.join(prismaDir, 'dev.db');
  const backupsDir = path.join(__dirname, '..', 'backups');

  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Source database file not found at: ${dbPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log(`📁 Created backups directory: ${backupsDir}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDbFileName = `cbs-backup-${timestamp}.db`;
  const backupMetaFileName = `cbs-backup-${timestamp}.json`;
  const backupDbPath = path.join(backupsDir, backupDbFileName);
  const backupMetaPath = path.join(backupsDir, backupMetaFileName);

  console.log(`⏳ Copying SQLite database binary to backup vault...`);
  fs.copyFileSync(dbPath, backupDbPath);

  // Compute SHA-256 checksums
  const srcHash = crypto.createHash('sha256').update(fs.readFileSync(dbPath)).digest('hex');
  const bkpHash = crypto.createHash('sha256').update(fs.readFileSync(backupDbPath)).digest('hex');

  if (srcHash !== bkpHash) {
    console.error('❌ Checksum mismatch detected! Backup verification failed.');
    process.exit(1);
  }

  console.log(`✅ SHA-256 Checksum Verified: ${bkpHash}`);

  const stat = fs.statSync(backupDbPath);
  console.log(`📊 Backup File Size: ${(stat.size / 1024).toFixed(2)} KB (${stat.size} bytes)`);

  // Extract critical table row counts
  console.log(`🔍 Auditing record counts across financial modules...`);
  const [
    userCount,
    customerCount,
    accountCount,
    transactionCount,
    transactionLineCount,
    loanAppCount,
    loanAccountCount,
    glAccountCount,
    auditLogCount,
    siCount,
    digitalReqCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.customer.count(),
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.transactionLine.count(),
    prisma.loanApplication.count(),
    prisma.loanAccount.count(),
    prisma.gLAccount.count(),
    prisma.auditLog.count(),
    prisma.standingInstruction.count(),
    prisma.digitalPaymentRequest.count()
  ]);

  const metadata = {
    backupId: `BCK-${timestamp}`,
    cbsSystem: 'Co-operative Bank / Pat Sanstha Core Banking System',
    cbsVersion: '1.8.0',
    createdAt: new Date().toISOString(),
    databaseSource: 'backend/prisma/dev.db',
    backupFile: backupDbFileName,
    sha256Checksum: bkpHash,
    sizeBytes: stat.size,
    sizeKb: parseFloat((stat.size / 1024).toFixed(2)),
    records: {
      users: userCount,
      customers: customerCount,
      depositAccounts: accountCount,
      transactions: transactionCount,
      transactionLines: transactionLineCount,
      loanApplications: loanAppCount,
      loanAccounts: loanAccountCount,
      glAccounts: glAccountCount,
      auditLogs: auditLogCount,
      standingInstructions: siCount,
      digitalPaymentRequests: digitalReqCount
    },
    verificationStatus: 'VERIFIED_OK'
  };

  fs.writeFileSync(backupMetaPath, JSON.stringify(metadata, null, 2), 'utf-8');

  console.log('\n================================================================');
  console.log('🎉 BACKUP CREATED AND INTEGRITY-VERIFIED SUCCESSFULLY!');
  console.log(`💾 Database Backup: ${backupDbPath}`);
  console.log(`📋 Metadata Record: ${backupMetaPath}`);
  console.log('📈 Record Summary:');
  console.table(metadata.records);
  console.log('================================================================\n');

  await prisma.$disconnect();
}

runBackup().catch(async (e) => {
  console.error('❌ Backup Failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
