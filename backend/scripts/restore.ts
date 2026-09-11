import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

async function runRestore() {
  console.log('================================================================');
  console.log('🏦 CO-OPERATIVE BANK / PAT SANSTHA CBS - DISASTER RECOVERY');
  console.log('♻️ Database Restore & Integrity Verification Utility');
  console.log('================================================================\n');

  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const targetBackupArg = args.find(a => !a.startsWith('--'));

  const backupsDir = path.join(__dirname, '..', 'backups');
  const prismaDir = path.join(__dirname, '..', 'prisma');
  const activeDbPath = path.join(prismaDir, 'dev.db');

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
  const backupDbPath = path.join(backupsDir, metadata.backupFile);

  if (!fs.existsSync(backupDbPath)) {
    console.error(`❌ Backup database binary missing: ${backupDbPath}`);
    process.exit(1);
  }

  console.log(`📋 Inspecting Backup Manifest: ${selectedMetaFile}`);
  console.log(`   - Backup ID: ${metadata.backupId}`);
  console.log(`   - Created At: ${metadata.createdAt}`);
  console.log(`   - Expected SHA-256: ${metadata.sha256Checksum}`);
  console.log(`   - File Size: ${metadata.sizeKb} KB`);
  console.log('\n📊 Record Counts in Backup Snapshot:');
  console.table(metadata.records);

  // Compute actual checksum
  console.log(`\n⏳ Validating cryptographic integrity of backup binary...`);
  const actualHash = crypto.createHash('sha256').update(fs.readFileSync(backupDbPath)).digest('hex');

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
  // Safety snapshot of current database
  if (fs.existsSync(activeDbPath)) {
    const preRestoreTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safetyCopyPath = path.join(backupsDir, `cbs-prerestore-safety-${preRestoreTimestamp}.db`);
    console.log(`🛡️ Creating safety snapshot of current active database: ${safetyCopyPath}`);
    fs.copyFileSync(activeDbPath, safetyCopyPath);
  }

  console.log(`⏳ Overwriting active database with verified snapshot...`);
  fs.copyFileSync(backupDbPath, activeDbPath);

  // Verify the newly written active DB matches
  const restoredHash = crypto.createHash('sha256').update(fs.readFileSync(activeDbPath)).digest('hex');
  if (restoredHash !== actualHash) {
    console.error(`❌ FATAL: Restored active database verification failed!`);
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('🎉 LIVE RESTORE COMPLETED SUCCESSFULLY!');
  console.log(`✅ Active Database at ${activeDbPath} is restored to snapshot ${metadata.backupId}`);
  console.log('================================================================\n');
}

runRestore().catch((e) => {
  console.error('❌ Restore Process Failed:', e);
  process.exit(1);
});
