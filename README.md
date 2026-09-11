# Co-operative Bank / Pat Sanstha Core Banking System (CBS)

An enterprise-grade, modular Core Banking Solution designed specifically for Co-operative Banks and Pat Sansthas.

Built according to the **Business Flow, Functional Modules & Application Architecture Document (Version 1.0, September 2026)**.

---

## 🏛️ System Overview

The system provides an end-to-end core banking platform with:
- **Strict Maker-Checker Workflow**: Dual-control approval for all sensitive financial and master data operations.
- **Controlled Business Date Engine**: Financial operations are tied to an explicit branch business date, not just wall-clock time.
- **Immutable Audit Trail**: Captures actor, role, branch, before/after state diffs, and timestamps for every mutation.
- **Double-Entry General Ledger Ready**: Architecture pre-wired for ACID financial postings where `Debits == Credits`.
- **Pat Sanstha Membership & Shareholding**: Member numbering, share capital, and relationship tracking.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (Tested on v24.20)
- **NPM**: v9+
- **Git**: Installed
- **Database**: SQLite (default zero-config) or MySQL 8.0+

### Setup Backend
```bash
cd backend
npm.cmd install
npx.cmd prisma db push
npm.cmd run seed
npm.cmd run dev
```
Backend API will start on: `http://localhost:5000`

### Setup Frontend
```bash
cd frontend
npm.cmd install
npm.cmd run dev
```
Frontend UI will start on: `http://localhost:5173`

---

## 🔑 Default Seed Credentials for Testing

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `Admin@123` | System config, organizations, global settings |
| **HO Admin** | `hoadmin` | `Admin@123` | Head Office operations, policy & products |
| **Branch Manager** | `bm_pune` | `Manager@123` | Branch oversight, business date & overrides |
| **Maker / Operator** | `maker_pune` | `Maker@123` | Customer data entry, KYC document submission |
| **Checker / Authorizer**| `checker_pune` | `Checker@123` | Review & approve/reject Maker submissions |
| **Auditor** | `auditor` | `Auditor@123` | Read-only inspection of immutable audit trails |

---

## 📁 Repository Structure

```
coop-bank-patsanstha/
├── PROGRESS.md            # Detailed 8-phase milestone progress tracker
├── README.md              # Documentation & setup guide
├── backend/               # Node.js + Express + TypeScript + Prisma ORM
│   ├── prisma/
│   │   ├── schema.prisma  # Enterprise banking data schema
│   │   └── seed.ts        # Comprehensive seed script with roles & users
│   └── src/
│       ├── config/        # Environment & database client
│       ├── middleware/    # Auth, RBAC, Audit logger, Error handler
│       └── modules/       # Domain modules (Auth, Org, Customer, KYC, Audit)
└── frontend/              # React + Vite + Tailwind CSS + Lucide
    └── src/
        ├── api/           # Typed API clients
        ├── components/    # Common UI elements & Maker-Checker banners
        ├── contexts/      # Authentication & Branch session contexts
        └── pages/         # Dashboard, Customers, KYC, Branches, Audit
```

---

## 🔄 Pushing to Remote Git (GitHub / GitLab)

To connect this local repository to your remote GitHub or GitLab repo:

```bash
# 1. Add your remote repository URL
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git

# 2. Rename branch to main (if not already)
git branch -M main

# 3. Push to remote
git push -u origin main
```
