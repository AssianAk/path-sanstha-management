import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

async function runRestore() {
  console.log('================================================================');
  console.log('🏦 CO-OPERATIVE BANK / PAT SANSTHA CBS - DISASTER RECOVERY');
  console.log('♻️ Database Restore & Integrity Verification Utility');
  console.log('================================================================\n');

  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const targetBackupArg = args.find(a => !a.startsWith('--'));

  const backupsDir = path.join(__dirname, '..', 'backups');

  if (!fs.existsSync(backupsDir)) {
    console.error(`❌ Backups directory not found at: ${backupsDir}`);
    process.exit(1);
  }

  // Find all .json metadata files
  const metaFiles = fs.readdirSync(backupsDir)
    .filter(f => f.startsWith('cbs-backup-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (metaFiles.length === 0) {
    console.error(`❌ No backups found in: ${backupsDir}`);
    process.exit(1);
  }

  let selectedMetaFile = metaFiles[0];
  if (targetBackupArg) {
    const candidate = targetBackupArg.endsWith('.json') ? targetBackupArg : `${targetBackupArg}.json`;
    if (metaFiles.includes(candidate)) {
      selectedMetaFile = candidate;
    } else {
      console.warn(`⚠️ Specified backup ${targetBackupArg} not found. Defaulting to latest: ${selectedMetaFile}`);
    }
  }

  const metaPath = path.join(backupsDir, selectedMetaFile);
  const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  const backupFilePath = path.join(backupsDir, metadata.backupFile);

  if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ Backup database archive missing: ${backupFilePath}`);
    process.exit(1);
  }

  console.log(`📋 Inspecting Backup Manifest: ${selectedMetaFile}`);
  console.log(`   - Backup ID: ${metadata.backupId}`);
  console.log(`   - Database Type: ${metadata.databaseType || 'SQLite'}`);
  console.log(`   - Created At: ${metadata.createdAt}`);
  console.log(`   - Expected SHA-256: ${metadata.sha256Checksum}`);
  console.log(`   - File Size: ${metadata.sizeKb} KB`);
  console.log('\n📊 Record Counts in Backup Snapshot:');
  console.table(metadata.records);

  // Compute actual checksum
  console.log(`\n⏳ Validating cryptographic integrity of backup archive...`);
  const actualHash = crypto.createHash('sha256').update(fs.readFileSync(backupFilePath)).digest('hex');

  if (actualHash !== metadata.sha256Checksum) {
    console.error(`❌ FATAL: Checksum mismatch!`);
    console.error(`   Expected: ${metadata.sha256Checksum}`);
    console.error(`   Actual:   ${actualHash}`);
    process.exit(1);
  }

  console.log(`✅ Cryptographic Checksum MATCH: Integrity 100% verified.`);

  if (!isExecute) {
    console.log('\n================================================================');
    console.log('ℹ️ DRY RUN COMPLETE: The backup archive is valid and ready.');
    console.log('   To restore this backup and overwrite the active database, run:');
    console.log(`   npx ts-node scripts/restore.ts ${selectedMetaFile} --execute`);
    console.log('================================================================\n');
    return;
  }

  console.log('\n⚠️ LIVE RESTORE INITIATED (--execute flag provided)');

  const dbUrl = process.env.DATABASE_URL || '';
  const isMySQL = dbUrl.startsWith('mysql://');

  if (isMySQL) {
    const parsed = new URL(dbUrl);
    const dbUser = decodeURIComponent(parsed.username);
    const dbPass = decodeURIComponent(parsed.password);
    const dbHost = parsed.hostname;
    const dbPort = parsed.port || '3306';
    const dbName = parsed.pathname.replace(/^\//, '');

    const mysqlBin = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe';
    console.log(`⏳ Restoring SQL dump into MySQL database [${dbName}]...`);
    const cmd = `"${mysqlBin}" -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPass} ${dbName} < "${backupFilePath}"`;
    execSync(cmd, { shell: 'cmd.exe' });
  } else {
    const prismaDir = path.join(__dirname, '..', 'prisma');
    const activeDbPath = path.join(prismaDir, 'dev.db');

    if (fs.existsSync(activeDbPath)) {
      const preRestoreTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safetyCopyPath = path.join(backupsDir, `cbs-prerestore-safety-${preRestoreTimestamp}.db`);
      console.log(`🛡️ Creating safety snapshot of current active database: ${safetyCopyPath}`);
      fs.copyFileSync(activeDbPath, safetyCopyPath);
    }

    console.log(`⏳ Overwriting active database with verified snapshot...`);
    fs.copyFileSync(backupFilePath, activeDbPath);
  }

  console.log('\n================================================================');
  console.log('🎉 LIVE RESTORE COMPLETED SUCCESSFULLY!');
  console.log(`✅ Active Database is restored to snapshot ${metadata.backupId}`);
  console.log('================================================================\n');
}

runRestore().catch((e) => {
  console.error('❌ Restore Process Failed:', e);
  process.exit(1);
});
