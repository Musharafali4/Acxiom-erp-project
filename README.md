# AcxiomCRM Enterprise Platform

An enterprise-grade Customer Relationship Management system developed in strict compliance with the **AcxiomCRM Functional & Technical Project Specification**.

---

## 🌟 Architecture & Highlights

- **Aesthetic**: Formal corporate executive design featuring deep corporate navy (`#0B192C`), crisp card containers, refined typography (`Inter`), responsive tables, and interactive Chart.js visualizations.
- **Layered Architecture**: Clean separation between Presentation Layer (SPA), Application/Routing Layer (Express), Business Logic & Validation Layer, and Data Access/Persistence Layer.
- **Security & RBAC**:
  - ASP.NET Core-grade password policy (minimum 8 characters, uppercase, lowercase, numbers, special characters).
  - Account lockout after 5 consecutive failed login attempts.
  - Role-based authorization (`Admin`, `Manager`, `SalesExecutive`).
  - Passwords hashed using salted `bcrypt`.
  - Immutable, append-only **Audit Log** capturing all logins, creations, updates, deletions, and security events.

---

## 🚀 Running the Project

The server is currently running locally on:
**[http://localhost:5000](http://localhost:5000)**

To run or restart the server manually:
```bash
npm start
```
or
```bash
node server.js
```

---

## 🔑 Pre-Seeded Enterprise Accounts

| Role | Email | Password | Scope / Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@acxiom.com` | `Admin@123!` | Full application administration, user/role management, audit logs, CRM records, reports. |
| **Manager** | `manager@acxiom.com` | `Password@123!` | Team customer/lead/opportunity/follow-up management, pipeline performance, management reports. |
| **Sales Executive** | `sarah.sales@acxiom.com` | `Password@123!` | Assigned customers, leads, opportunities, follow-ups, and sales dashboard. |

*Note: You can switch between active roles instantly via the quick role dropdown in the top navigation bar or log in with the preset buttons on the login screen.*

---

## 📋 Module Tree Implementation (Section 17.2)

```
AcxiomCRM
├── Authentication
│   ├── Login (with password hashing & 5-attempt account lockout)
│   ├── Register (policy enforced)
│   ├── Logout
│   └── Access Control (Admin, Manager, SalesExecutive)
├── Dashboard
│   ├── Total Customers KPI
│   ├── Total Leads KPI
│   ├── Open Opportunities KPI
│   ├── Won Opportunities KPI
│   ├── Lost Opportunities KPI
│   ├── Total Pipeline Value KPI
│   └── Chart.js Visualizations (Pipeline by Stage, Lead Status, Monthly Revenue)
├── Customer Management
│   ├── Create (Email & 10-digit phone uniqueness & format validation)
│   ├── Edit
│   ├── Details (with associated opportunities & scheduled follow-ups)
│   ├── Delete / Deactivate (restricted to Admin/Manager)
│   └── Search & Filter
├── Lead Management
│   ├── Create
│   ├── Edit
│   ├── Details
│   ├── Delete
│   ├── Lead Status Workflow (New, Contacted, Qualified, Unqualified, Converted, Lost)
│   └── Lead Conversion Wizard (auto-creates Customer and optional Opportunity)
├── Opportunity Management
│   ├── Create (Amount > 0, Probability 0-100%, Close date validation)
│   ├── Edit
│   ├── Details
│   ├── Delete
│   └── Sales Pipeline (Stage tracking: Qualification, Proposal, Negotiation, Won, Lost)
├── Follow-Up
│   ├── Schedule Follow-Up (Date cannot be earlier than today for planned items)
│   ├── Complete Follow-Up
│   └── Pending & Overdue Follow-Ups tracking
├── Activity Management
│   ├── Call Log
│   ├── Meeting Log
│   ├── Email Log
│   └── Task Log
├── User & Role Management (Admin Only)
│   ├── Users provision & edit
│   ├── Roles & Permissions
│   └── Lockout status toggle & Admin Password Reset
└── Audit Log (Admin & Manager)
    ├── Login & Failed Login tracking
    ├── Create, Update, Delete entity audit trail
    └── Security policy & lockout events
```

---

## 🧪 Automated Section 17.19 Acceptance Verification

Run the automated acceptance suite verifying all 14 criteria:
```bash
node test_suite.js
```

All 14 acceptance criteria are validated:
1. `GET /api/customers` unauthenticated returns `401 Unauthorized` ✅
2. Valid user authentication returns token and dashboard access ✅
3. Invalid customer email/phone rejected with inline & server errors ✅
4. Browser validation bypass rejected on the server ✅
5. Opportunity Amount `<= 0` rejected ✅
6. Opportunity Probability `> 100` rejected ✅
7. Expected Close Date in the past rejected for active deals ✅
8. Planned Follow-Up dated in the past rejected ✅
9. SalesExecutive role restricted to assigned sales scope ✅
10. Manager role granted team pipeline & report visibility ✅
11. Admin role granted user governance & audit access ✅
12. Every CRM record creation/update generates an audit entry ✅
13. REST endpoints return clean JSON payloads without sensitive secrets ✅
14. Dashboard KPI cards and Chart.js datasets deliver authorized metrics ✅
