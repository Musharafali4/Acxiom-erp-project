# ACXIOMCRM

**ACXIOMCRM** is an enterprise-grade Customer Relationship Management and Commercial Operations platform engineered to bridge front-office relationship tracking with back-office order-to-cash execution. Developed for modern B2B organizations, multi-tier sales departments, and corporate revenue teams, the platform solves critical operational friction—including fragmented lead qualification, deal pipeline blindspots, uncoordinated client communications, and disconnected order invoicing. By unifying the complete enterprise commercial lifecycle within a single, secure, role-governed system, ACXIOMCRM manages prospect acquisition, Customer 360 account governance, opportunity probability weighting, multi-channel touchpoint logging, commercial sales order dispatch, receivables aging, and real-time executive analytics. It serves corporate leadership, sales managers, and account executives by eliminating data silos, accelerating deal velocity, safeguarding audit compliance, and maximizing cash-flow realization.

---

## 📋 Project Overview

ACXIOMCRM structures enterprise business operations into a unified, disciplined end-to-end workflow:

```
Lead Capture
      ↓
Lead Qualification
      ↓
Customer Management (Customer 360)
      ↓
Opportunity Management
      ↓
Follow-Up & Touchpoint Activities
      ↓
Sales Pipeline & Deal Forecasting
      ↓
ERP Sales Transactions & Order Processing
      ↓
Financial & Receivables Analytics
      ↓
Enterprise Reports & Immutable Audit Logging
```

### End-to-End Business Stages Explained

1. **Lead Capture**: Prospective clients are ingested through multi-channel sources (digital campaigns, corporate outbound, inbound referrals, enterprise summits) with validation rules enforcing email formatting and 10-digit mobile verification.
2. **Lead Qualification**: Inbound leads undergo discovery scoring against corporate Ideal Customer Profiles (ICP), enabling commercial teams to triage high-priority opportunities from unqualified accounts.
3. **Customer Management (Customer 360)**: Qualified leads convert directly into official customer master accounts, establishing primary contact ownership, corporate account relationships, and historical transaction ledgers.
4. **Opportunity Management**: High-intent sales engagements are formalized into distinct opportunities characterized by deal currency value, probability-weighted estimates, and contract close milestones.
5. **Follow-Up & Touchpoint Activities**: Client interactions are systematically orchestrated through scheduled follow-up commitments, call logs, boardroom meetings, written correspondence, and deliverable tasks to guarantee zero deal slippage.
6. **Sales Pipeline & Deal Forecasting**: Pipeline visibility offers weighted forecasting across sequential sales stages (Qualification &rarr; Proposal &rarr; Negotiation &rarr; Closed-Won / Closed-Lost).
7. **ERP Sales Transactions & Order Processing**: When deals reach Closed-Won status, the commercial ERP layer generates formal Sales Orders with line items, tax schedules (GST 18%), delivery targets, and commercial invoicing.
8. **Financial & Receivables Analytics**: The billing engine tracks cash collections against dispatched invoices, aging buckets (Net-30, 31–60, 61–90, 90+ days), and revenue realization rates.
9. **Enterprise Reports & Immutable Audit Logging**: Senior management assesses operational KPIs, while compliance officers retain tamper-proof, append-only logs documenting every authentication event, privilege change, and database modification.

---

## 🔄 Business Workflow

The commercial order-to-cash lifecycle and revenue operations flow seamlessly through the following architectural state progression:

```mermaid
flowchart LR
    A["Lead Capture"] --> B["Lead Qualification"]
    B --> C["Customer Master (360)"]
    C --> D["Opportunity Scoping"]
    D --> E["Quotation & Proposal"]
    E --> F["Sales Order Confirmation"]
    F --> G["Fulfillment & Delivery"]
    G --> H["Commercial Invoice"]
    H --> I["Payment Collection"]
    I --> J["Financial Analytics & Audit"]

    style A fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#1e1b4b
    style B fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#1e1b4b
    style C fill:#dcfce7,stroke:#10b981,stroke-width:2px,color:#064e3b
    style D fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#78350f
    style E fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#78350f
    style F fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
    style G fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
    style H fill:#ede9fe,stroke:#8b5cf6,stroke-width:2px,color:#4c1d95
    style I fill:#dcfce7,stroke:#10b981,stroke-width:2px,color:#064e3b
    style J fill:#f1f5f9,stroke:#475569,stroke-width:2px,color:#0f172a
```

---

## ⚡ Key Features

### 🏢 Customer Management & Customer 360
- **Master Customer Index**: Centralized account ledger recording account codes (`CUST-XXXX`), corporate entity names, primary contacts, corporate emails, and validated 10-digit telephone numbers.
- **Customer 360 View**: Contextual overview pane displaying associated opportunities, scheduled follow-up appointments, historical touchpoints, commercial sales orders, and issued invoices in one interface.
- **Search & Filter Matrix**: Real-time multi-attribute search across corporate name, contact representative, and city, coupled with lifecycle status filters (`Active`, `Prospect`, `Inactive`).
- **Territory & Account Ownership**: Granular assignment model linking accounts directly to assigned sales representatives and managerial teams.

### 🎯 Lead Management & Conversion Engine
- **Lead Capture & Triage**: Structured ingestion with automatic verification against email formatting and mobile contact standards.
- **Stage Progression**: Transparent workflow tracking (`New` &rarr; `Contacted` &rarr; `Qualified` &rarr; `Unqualified` &rarr; `Converted` &rarr; `Lost`).
- **One-Click Lead Conversion Wizard**: Automated conversion pipeline turning qualified prospects into Customer Master entities and optionally seeding an active Opportunity with pre-filled deal values, preserving full audit continuity.

### 💼 Opportunity Management & Deal Pipeline
- **Stage Milestones**: Structured pipeline stages comprising `Qualification` (20%), `Proposal` (50%), `Negotiation` (75%), `Won` (100%), and `Lost` (0%).
- **Weighted Value Forecasting**: Server-side mathematical computation calculating `Weighted Amount = Amount × (Probability / 100)` to yield realistic revenue forecasts.
- **Temporal Integrity Guardrails**: Strict server-side validation rejecting non-positive contract amounts (`Amount > 0`), out-of-range probabilities (`0% ≤ Probability ≤ 100%`), and backward-dated target close dates.

### 📅 Follow-Up Scheduling & Task Tracking
- **Automated Schedule Ledger**: Synchronized follow-up engine capturing meeting types (`Call`, `Meeting`, `Demo`, `Email`), scheduled timestamps, priority indicators, and detailed discussion agendas.
- **Overdue Detection & Alerts**: Automated date-differential logic highlighting overdue commitments in high-visibility red indicators.
- **Lifecycle Progression**: Seamless status transitions (`Planned` &rarr; `Completed` &rarr; `Missed`) with validation preventing future-dated tasks from being erroneously back-dated.

### 📝 Activity Management & Touchpoint Logs
- **Multi-Channel Engagement Logging**: Immutable activity registers documenting client calls, physical or video meetings, email correspondence, and task completions.
- **Bi-Directional Associativity**: Automatic association with target customer accounts and active opportunity records for end-to-end historical transparency.

### 📊 Sales Pipeline Intelligence
- **Visual Stage Breakdown**: Chart.js doughnut and bar visualizers dissecting pipeline distribution across distinct deal stages.
- **Executive Summaries**: Aggregated metrics reflecting total pipeline exposure, active opportunity counts, and win/loss performance ratios.

### 📦 Commercial ERP Sales Operations
- **Order-to-Cash Execution**: Bridge connecting CRM deals with ERP order fulfillment.
- **Sales Order Generation**: Itemized sales orders detailing deliverable descriptions, quantities, unit prices, standard GST taxation (18%), and net contract valuations.
- **Invoice Management**: Automated billing schedules generating commercial invoices with payment terms, due dates, paid balances, and remaining liabilities.

### 💰 Financial & Receivables Analytics
- **Commercial Financial KPIs**: High-visibility dashboard metrics computing Gross Invoiced Value, Reconciled Cash Collections, Outstanding Accounts Receivable (AR), and Overdue Exposure.
- **Collection Realization Rate**: Real-time financial efficiency KPI calculating `(Reconciled Collections / Total Invoiced) × 100`.
- **Receivables Aging Matrix**: Industry-standard aging buckets categorizing outstanding balances:
  - **Current (0–30 Days)**: Normal commercial credit terms.
  - **31–60 Days Overdue**: Level-1 commercial reminder threshold.
  - **61–90 Days Overdue**: Managerial escalation threshold.
  - **90+ Days Critical Overdue**: Legal recovery & commercial credit freeze hold.

### 📈 Executive Dashboards & BI Visualizations
- **Role-Tailored Executive Views**: Dynamically calibrated perspectives customized for executive governance, department managers, or frontline quota carriers.
- **Real-Time KPI Cards**: Live telemetry cards monitoring Total Customers, Inbound Leads, Open Deals, Won Revenue, Pipeline Valuation, and Pending Tasks.
- **Interactive Visualizations**: Powered by Chart.js featuring Pipeline Value by Stage, Lead Status Distribution, and Monthly Closed Revenue.

### 📑 Enterprise Reporting Suite
- **Pipeline Analysis Report**: Deep-dive tabular reporting with stage-by-stage valuations, weighted forecasts, and expected close trajectories.
- **Conversion & Win-Rate Analytics**: Quantitative win/loss ratio metrics analyzing conversion performance across lead sources and representatives.
- **User Activity Audit Report**: Productivity metrics aggregating calls made, meetings attended, tasks completed, and deals closed per team member.
- **Customer Master Report**: Exportable corporate master register formatted for compliance review and external audit submission.

### 🛡️ Security, Governance & Audit Logging
- **Immutable Audit Trail**: Append-only event store recording timestamp, user ID, actor email, network IP address, action category (`Login`, `Failed Login`, `Create`, `Update`, `Delete`, `Security`), entity type, record ID, and contextual payload metadata.
- **Tamper Resistance**: Non-destructive deletion model and cryptographically secured tokens preventing unauthorized ledger manipulation.

### 👥 Role-Based Access Control (RBAC) Matrix

| Capability / Resource | Sales Executive | Sales Manager | System Administrator |
| :--- | :---: | :---: | :---: |
| **Personal Dashboard & Assigned Leads** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Customer Master Creation & Search** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Lead Conversion & Opportunity Creation** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Follow-Up Scheduling & Activity Logging** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Commercial ERP Orders & Invoices (View)** | ✅ Assigned Scope | ✅ Team Scope | ✅ Global Scope |
| **Department Pipeline & Management Reports** | ❌ Restricted | ✅ Full Access | ✅ Full Access |
| **Customer & Opportunity Deletion** | ❌ Restricted | ✅ Full Access | ✅ Full Access |
| **System Security Audit Trail Inspection** | ❌ Blocked (403) | ❌ Restricted | ✅ Full Access |
| **User Provisioning & Account Administration** | ❌ Blocked (403) | ❌ Blocked (403) | ✅ Full Access |
| **Account Lockout Reset & Security Policy** | ❌ Blocked (403) | ❌ Blocked (403) | ✅ Full Access |

---

## 🛠️ Technology Stack & Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION TIER                      │
│   Vanilla JS (ES6+ SPA) • Enterprise Design System CSS3     │
│   FontAwesome 6.5 • Chart.js 4.4 Data Visualizations        │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / REST APIs (Bearer Auth)
┌──────────────────────────────▼──────────────────────────────┐
│                     APPLICATION SERVICE                     │
│   Node.js runtime • Express.js 4 Enterprise Application     │
│   Security Middlewares (CORS, Anti-Tamper, Rate Governance) │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────┐      ┌──────────────────┐     ┌──────────────┐
│  RBAC Auth   │      │ Business Logic   │     │ Server Input │
│  & JWT Token │      │ & Workflow Engine│     │  Validation  │
└──────────────┘      └──────────────────┘     └──────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                      DATA STORAGE TIER                      │
│   ACID-Compliant JSON File Store • Bcrypt Password Hashing  │
│   Append-Only Audit Journal • Automated File Synchronization│
└─────────────────────────────────────────────────────────────┘
```

- **Backend Runtime**: Node.js (v18+) & Express.js
- **Frontend Architecture**: High-performance Single Page Application (SPA) built with Semantic HTML5, Vanilla JavaScript (ES6+), and a custom Corporate Design System (CSS3 Custom Properties)
- **Data Visualizations**: Chart.js v4.4 (Canvas-based hardware-accelerated charting)
- **Authentication**: Stateless JSON Web Tokens (JWT) with salted `bcrypt` password encryption
- **Security Headers**: Standard defense-in-depth headers including `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `X-XSS-Protection: 1; mode=block`
- **Data Persistence**: In-memory database with ACID-style transactional JSON persistence and automatic seed fallback

---

## 🚀 Quickstart & Installation

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/Musharafali4/Acxiom-erp-project.git
cd Acxiom-erp-project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Application Server
```bash
npm start
```
The server will initialize on port `5000`:
```
====================================================
  AcxiomCRM Enterprise System running on port 5000
  Access URL: http://localhost:5000
====================================================
```

### 4. Open in Browser
Navigate to **`http://localhost:5000`** in your web browser.

---

## 🧪 Automated Verification Test Suite

ACXIOMCRM includes an end-to-end automated verification harness testing server-side enforcement, authorization boundaries, validation rejections, and business logic:

```bash
node test_suite.js
```

### Verified Test Scenarios
```
--- STARTING ACXIOMCRM ACCEPTANCE VERIFICATION ---

[Scenario 1]  Unauthenticated Access Blocked: Status 401                    -> PASS ✅
[Scenario 2]  Admin Login & JWT Token Issuance: Status 200                  -> PASS ✅
[Scenario 3]  Server Rejects Invalid Customer Email: Status 400              -> PASS ✅
[Scenario 4]  Server Rejects Invalid Customer Phone (10-digit mobile): 400  -> PASS ✅
[Scenario 5]  Opportunity Amount <= 0 Rejected: Status 400                  -> PASS ✅
[Scenario 6]  Opportunity Probability > 100 Rejected: Status 400           -> PASS ✅
[Scenario 7]  Opportunity Target Close Date in Past Rejected: Status 400     -> PASS ✅
[Scenario 8]  Planned Follow-Up Date in Past Rejected: Status 400           -> PASS ✅
[Scenario 9]  Sales Executive Audit Log Access Blocked: Status 403          -> PASS ✅
[Scenario 10] Manager Pipeline Report Access Authorized: Status 200          -> PASS ✅
[Scenario 11] Admin User Administration Access Authorized: Status 200       -> PASS ✅
[Scenario 12] Audit Trail Entry Generated on Record Creation                -> PASS ✅
[Scenario 13] Customers Master Data Retrieval Delivered                     -> PASS ✅
[Scenario 14] Executive Dashboard KPIs & Analytics Engine Operational       -> PASS ✅

--- ALL SPECIFICATION CRITERIA VERIFIED AND PASSING! ---
```

---

## 🔒 Pre-Seeded Demonstration Accounts

For demonstration and testing, the application includes pre-configured accounts representing each organizational role:

| Organizational Role | Work Email | Test Password | Accessible Modules & Permissions |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@acxiom.com` | `Admin@123!` | Complete administrative control, user provisioning, role assignments, security lockout resets, system audit logs, full CRM & ERP operations. |
| **Sales Manager** | `manager@acxiom.com` | `Password@123!` | Team-wide customer & opportunity oversight, conversion analytics, sales pipeline reports, customer deletion, and commercial ERP review. |
| **Sales Executive** | `sarah.sales@acxiom.com` | `Password@123!` | Assigned lead qualification, customer records, opportunity pipeline, follow-up scheduling, and activity logs. Restricted from admin logs and user management. |

> **Security Note**: These credentials are provided exclusively for local sandbox evaluation and automated testing. In production environments, credentials are provisioned dynamically through the User Administration Console with unique passwords adhering to enterprise complexity requirements.

---

## 📄 License & Compliance

Distributed under the **MIT License**. Engineered in compliance with enterprise CRM software standards, role-based governance frameworks, and secure API architecture practices.
