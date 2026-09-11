# Co-operative Bank / Pat Sanstha Core Banking System (CBS)
## Project Progress & Roadmap Tracker

> **Architecture Reference**: Business & Solution Architecture Document (Version 1.0, September 2026)  
> **System Type**: Modular Monolith Core Banking Platform for Co-operative Banks and Urban/Rural Pat Sansthas.  
> **Last Updated**: 2026-09-11

---

## Overall Implementation Roadmap

| Phase | Phase Name | Scope Summary | Status | Progress |
| :--- | :--- | :--- | :---: | :---: |
| **Phase 1** | **Foundation** | Auth/RBAC, Org/Branch, Customer/Member Master, KYC, Audit, Settings | 🟢 Completed | 100% |
| **Phase 2** | **Accounts & CASA** | Products, Savings/Current, Deposits (FD/RD), Teller/Cash, Transfers | 🟢 Completed | 100% |
| **Phase 3** | **Loans & Advances** | Loan Origination, Appraisal, Sanction, Disbursement, Repayment Waterfall | ⚪ Next Up | 0% |
| **Phase 4** | **Collections & Recovery**| Overdue monitoring, DPD calculation, Collector assignment, Notices, NPA | ⚪ Not Started | 0% |
| **Phase 5** | **General Ledger & Accounting**| Chart of Accounts (COA), Multi-branch GL posting, Trial Balance, P&L, Balance Sheet | ⚪ Not Started | 0% |
| **Phase 6** | **Reporting & MIS** | Regulatory returns, MIS dashboards, Member statements, Cash position | ⚪ Not Started | 0% |
| **Phase 7** | **Digital Channels & Integrations** | Member self-service portal, SMS/Email/WhatsApp alerts, Payment gateway rails | ⚪ Not Started | 0% |
| **Phase 8** | **Hardening & Rollout** | Security audit, Performance benchmarks, Disaster Recovery, Production cutover | ⚪ Not Started | 0% |

---

## Phase 2: Accounts & CASA (Completed Deliverables)

### ✅ Completed & Tested Items:

- [x] **Deposit Products Configuration (Section 6 & 29)**
  - [x] Pre-configured product catalog with annual interest rates, min balance rules, compounding frequency, and GL liability accounts:
    - `SB001`: Samruddhi Regular Savings Bank Account (3.5% p.a., quarterly compounding, min bal ₹500, `GL-2001`)
    - `CA001`: Samruddhi Business Current Account (0%, min bal ₹5,000, `GL-2002`)
    - `FD001`: Samruddhi Term Deposit (7.25% p.a., quarterly compounding, min ₹10,000, `GL-2003`)
    - `RD001`: Lakhpati Recurring Deposit Scheme (7.0% p.a., monthly installments, min ₹1,000, `GL-2004`)
  - [x] Product management API with role authorization

- [x] **Account Opening & Term Deposit Engine (Section 6 & 21)**
  - [x] Dynamic account numbering sequence: `SB-YYYY-XXXXX`, `CA-YYYY-XXXXX`, `FD-YYYY-XXXXX`, `RD-YYYY-XXXXX`
  - [x] KYC gate: Restricts account opening to verified `ACTIVE` customers
  - [x] Automated compounding maturity value projection for Term Deposits ($A = P(1 + r/n)^{nt}$)
  - [x] Recurring Deposit monthly installment schedules & tenure parameters
  - [x] Initial deposit posting with atomic double-entry balance updates

- [x] **Front-Desk Cash & Teller Operations (Section 8 & 21)**
  - [x] Real-time Teller Till drawer session tracking (`openingBalance`, `totalCashReceived`, `totalCashPaid`, `currentBalance`)
  - [x] Interactive currency denomination counter (₹500, ₹200, ₹100, ₹50, ₹20, ₹10, and coins) with live auto-summing
  - [x] Cash Deposit flow with account balance credit and till cash increment
  - [x] Cash Withdrawal flow with account available balance check and drawer cash validation
  - [x] End-of-Day (EOD) physical cash balancing with shortage/excess calculation and supervisor sign-off

- [x] **Internal Account-to-Account Fund Transfers (Section 9 & 21)**
  - [x] Real-time beneficiary account validation
  - [x] Available fund validation with freeze/dormancy safeguards
  - [x] Atomic debit to source account + credit to destination account
  - [x] Instant printable Payment Advice / Transfer Receipt with unique reference (`TXN-YYYYMMDD-XXXXX`)

- [x] **Core Accounting Posting Engine & Financial Invariant (Section 21 & 31)**
  - [x] ACID financial posting engine guaranteeing the invariant:
    $$\sum \text{Debits} = \sum \text{Credits}$$
  - [x] Balanced journal entries across `GL-1001 Cash in Hand` and `GL-2001/2/3/4 Customer Deposit Liabilities`
  - [x] Full integration into immutable audit trail

- [x] **User Interface (React + Tailwind CSS)**
  - [x] Accounts & Deposits Hub with CASA vs Term Deposit categorization, search, and 360° Account Detail modal
  - [x] Teller Cash Counter screen with interactive denomination calculator and EOD balancing
  - [x] Fund Transfer screen with instant beneficiary lookup and printable advice
  - [x] Updated Executive Dashboard displaying Total Deposit Liability, Till Cash In Hand, and GL invariant status

---

## Phase 1: Foundation (Recap of Completed Scope)
- [x] Auth & RBAC (11 institutional roles, bcrypt, JWT)
- [x] Multi-Branch hierarchy with Controlled Business Date Engine (`OPEN` / `CUTOFF` / `CLOSED`)
- [x] Customer & Member Master (Share capital, certificate tracking, nominee management)
- [x] KYC & Maker-Checker Dual-Control Workflow
- [x] Immutable Audit Trail with side-by-side JSON state diffs

---

## Phase 3: Loans & Advances (Next Sprint Scope)

- [ ] **Loan Products Catalog**: Personal Loans, Vehicle Loans, Gold Loans, Business/Mortgage Loans, Agricultural Term Loans.
- [ ] **Loan Origination System (LOS)**: Application capture, co-applicants, guarantors, collateral appraisal, credit grading.
- [ ] **Sanction & Disbursement Engine**: Sanction letter generation, deduction of processing fees/charges, disbursement directly into customer savings account with balanced GL journal.
- [ ] **Repayment Schedule Generation**: Reducing balance EMI schedules and flat interest amortization tables.
- [ ] **Waterfall Repayment Allocation**: Charges/fees → Penalty/late fees → Overdue Interest → Current Interest → Principal.
