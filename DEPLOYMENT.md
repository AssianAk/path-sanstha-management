# 🏦 Co-operative Bank / Pat Sanstha CBS — Production Deployment & Operations Runbook

Comprehensive deployment, hardening, and disaster recovery guide for the Urban Co-operative Bank / Pat Sanstha Core Banking System (CBS).

---

## 📋 System Overview & Architecture

- **Architecture Pattern**: Modular Monolith
- **Backend Stack**: Node.js 20+, Express, TypeScript, Prisma ORM
- **Frontend Stack**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Database**: SQLite (Local / Edge / Single Branch) / MySQL 8.0+ (Multi-Branch Distributed Production)
- **Security Engine**: Helmet HTTP security headers, Express Rate Limiting, Role-Based Access Control (11 Roles), Dual-Control Maker-Checker Approval Workflows, Immutable Audit Trail.
- **Accounting Engine**: Double-Entry Ledger Invariant ($\sum \text{Debits} \equiv \sum \text{Credits}$) enforced across all financial transactions.

---

## 🛠️ Prerequisites

| Dependency | Minimum Version | Production Recommendation |
| :--- | :--- | :--- |
| **Node.js** | `v20.x LTS` | `v20.18+ LTS` |
| **npm** | `v10.x` | `v10.8+` |
| **Docker Engine** | `v24.x` | `v26.x+` with BuildKit enabled |
| **Docker Compose** | `v2.20+` | `v2.27+` |
| **OpenSSL** | `v1.1.1` | `v3.0+` |

---

## 🚀 Deployment Options

### Option A: Bare-Metal / Virtual Machine (Host Native)

#### 1. Backend Setup & Build
```powershell
# Navigate to backend
cd backend

# Install dependencies
npm install

# Generate Prisma Client & Run Database Migrations
npx prisma generate
npx prisma db push

# (Optional) Seed initial institutional roles and test data
npm run seed

# Build TypeScript to production JavaScript
npm run build

# Start production server
npm start
```
*Backend runs on `http://localhost:5000`.*

#### 2. Frontend Setup & Build
```powershell
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Build production SPA
npm run build

# Preview locally or serve via Nginx / PM2 / Caddy
npm run preview
```
*Frontend runs on `http://localhost:5173` (development) or `http://localhost:4173` (preview).*

---

### Option B: Docker Containerized Deployment (Recommended)

The system includes production multi-stage `Dockerfile`s and `docker-compose.yml`.

```powershell
# From project root
docker compose up --build -d
```

#### Health Status Verification
```powershell
docker compose ps
curl http://localhost:5000/api/health
curl http://localhost:5000/api/system/health-diagnostics
```

- **Frontend Web Portal**: `http://localhost` (Port 80)
- **Backend API**: `http://localhost:5000`

---

## 🔒 Security Hardening Checklist

| Control | Implementation | Verification |
| :--- | :--- | :--- |
| **HTTP Security Headers** | `helmet` middleware active on all routes | Confirms `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security` |
| **Brute-Force Rate Limiting** | `express-rate-limit` active on `/api/auth/login` and `/api/digital/member/login` | 30 requests per 5 minutes per IP. Returns HTTP 429 upon threshold breach |
| **Session & Token Security** | JWT with 8-hour expiry and signed HMAC-SHA256 signature | Expired/tampered tokens immediately return HTTP 401 |
| **Dual Control (Maker-Checker)** | Four-eyes principle on accounts, loans, KYC, and manual JV | Maker cannot approve own records; non-supervisors rejected |
| **Auditing & Traceability** | `AuditLog` table records actor, IP, timestamp, and JSON diffs | Available under `/audit` and `/api/audit` |
| **Zero-Imbalance Ledger** | Strict double-entry invariant validation in all transactional services | Transactions rejected if $\sum \text{Debits} \neq \sum \text{Credits}$ |

---

## 📦 Disaster Recovery (DR) & Backup Runbook

The CBS provides automated hot/cold database backup and verification scripts with SHA-256 cryptographic hashing.

### 1. Generating an Automated Hot Backup
```powershell
cd backend
npm run backup
```
**Process Executed**:
1. Creates snapshot `backend/backups/cbs-backup-<ISO-TIMESTAMP>.db`.
2. Computes SHA-256 checksum on both source and target files.
3. Audits table record counts across Users, Customers, Accounts, Transactions, Loans, GL, Audit Logs, and Digital channels.
4. Generates companion JSON manifest `cbs-backup-<ISO-TIMESTAMP>.json`.

### 2. Validating & Restoring from Backup
```powershell
# Dry-run verification of the latest backup (read-only integrity check)
npm run restore

# Or specify a specific backup manifest:
npx ts-node scripts/restore.ts cbs-backup-2026-09-11T07-34-28-991Z.json

# Live Restoration (overwrites active database with automated safety snapshot)
npx ts-node scripts/restore.ts cbs-backup-2026-09-11T07-34-28-991Z.json --execute
```

### 3. Recommended Automated Backup Cron Schedule
For production deployments, schedule automated hourly/daily backups:
```bash
# Crontab example for daily hot backup at 23:30 (after EOD Cutoff)
30 23 * * * cd /opt/coop-cbs/backend && npm run backup >> /var/log/cbs-backup.log 2>&1
```

---

## 🌅 Business Date & EOD Operations Runbook

Co-operative Banks and Pat Sansthas operate under a strict controlled business date lifecycle:

```
[ OPEN ]  ──(Teller / Day Transactions)──>  [ CUTOFF ]  ──(EOD Checks & Balancing)──>  [ CLOSED ]  ──(Advance Date)──>  [ OPEN ]
```

1. **Morning Opening**:
   - Teller opens physical cash counter (`/teller`).
   - Vault cash is assigned and denominations tallied.
2. **Business Cutoff**:
   - At end of counter hours, Teller executes Cash Tally.
   - Status switches to `CUTOFF`. New customer deposits/withdrawals pause.
3. **EOD Verification**:
   - Generate Daily Trial Balance (`/gl` $\to$ Trial Balance).
   - Ensure Difference between Debits and Credits is exactly ₹0.00.
4. **Date Rollover**:
   - Close business date and advance system date.

---

## 👥 Default Institutional Credentials (Seeded Environment)

| Username | Role | Default Password | Access Modules |
| :--- | :--- | :--- | :--- |
| `superadmin` | `HO_ADMIN` | `Admin@123` | Master configuration, users, system settings |
| `branchmgr` | `BRANCH_MANAGER` | `Admin@123` | Dual-control approvals, branch MIS, EOD |
| `teller1` | `CASHIER` | `Admin@123` | Cash counter, deposits, withdrawals, transfers |
| `loanoff` | `LOAN_OFFICER` | `Admin@123` | Loan applications, appraisal, disbursement |
| `recovoff` | `COLLECTION_OFFICER` | `Admin@123` | NPA recovery desk, PTP tracking, legal notices |
| `accountant` | `ACCOUNTANT` | `Admin@123` | Journal vouchers, Trial Balance, P&L, Balance Sheet |
| `auditor` | `AUDITOR` | `Admin@123` | Regulatory returns (Form I, Form IX), audit logs |
| `CUST-2026-00001` | Member (Customer) | `Member@123` (or MPIN `1234`) | Member 360 portal, UPI QR, passbook, e-Mandate |

---

## 📞 Support & Maintenance
- **System Version**: 1.8.0 Production Release
- **Architecture**: Urban Co-operative Bank / Pat Sanstha CBS
- **Regulatory Compliance**: RBI Banking Regulation Act (AACS) 1949, Maharashtra Co-operative Societies Act 1960.
