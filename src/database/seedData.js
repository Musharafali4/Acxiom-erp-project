const bcrypt = require('bcryptjs');

// Pre-compute salt & hashes for standard accounts
// Default password for all seed accounts: Password@123!
const salt = bcrypt.genSaltSync(10);
const defaultPasswordHash = bcrypt.hashSync('Password@123!', salt);
const adminPasswordHash = bcrypt.hashSync('Admin@123!', salt);

const initialRoles = [
  { RoleId: 'role-1', RoleName: 'Admin', Description: 'Full application administration, users/roles, audit logs, configuration, all CRM records and reports.' },
  { RoleId: 'role-2', RoleName: 'Manager', Description: 'Monitor/manage team CRM data, pipeline, follow-ups, opportunities and reports.' },
  { RoleId: 'role-3', RoleName: 'SalesExecutive', Description: 'Manage assigned customers, leads, opportunities, follow-ups and activities.' }
];

const initialUsers = [
  {
    UserId: 'user-admin',
    Name: 'Eleanor Vance',
    Email: 'admin@acxiom.com',
    PasswordHash: adminPasswordHash,
    RoleId: 'role-1',
    RoleName: 'Admin',
    IsActive: true,
    FailedLoginCount: 0,
    LockoutEnd: null,
    CreatedDate: '2026-01-10T09:00:00.000Z'
  },
  {
    UserId: 'user-manager',
    Name: 'Marcus Sterling',
    Email: 'manager@acxiom.com',
    PasswordHash: defaultPasswordHash,
    RoleId: 'role-2',
    RoleName: 'Manager',
    IsActive: true,
    FailedLoginCount: 0,
    LockoutEnd: null,
    CreatedDate: '2026-01-12T10:30:00.000Z'
  },
  {
    UserId: 'user-sales-1',
    Name: 'Sarah Jenkins',
    Email: 'sarah.sales@acxiom.com',
    PasswordHash: defaultPasswordHash,
    RoleId: 'role-3',
    RoleName: 'SalesExecutive',
    IsActive: true,
    FailedLoginCount: 0,
    LockoutEnd: null,
    CreatedDate: '2026-01-15T11:00:00.000Z'
  },
  {
    UserId: 'user-sales-2',
    Name: 'Rajesh Sharma',
    Email: 'raj.sales@acxiom.com',
    PasswordHash: defaultPasswordHash,
    RoleId: 'role-3',
    RoleName: 'SalesExecutive',
    IsActive: true,
    FailedLoginCount: 0,
    LockoutEnd: null,
    CreatedDate: '2026-01-18T14:20:00.000Z'
  }
];

const initialCustomers = [
  {
    CustomerId: 'cust-101',
    CustomerCode: 'CUST-00101',
    CustomerName: 'Apex Cloud Solutions Pvt Ltd',
    Email: 'procurement@apexcloud.com',
    Phone: '9876543210',
    CompanyName: 'Apex Cloud Solutions',
    Address: '402 Cyber Tech Hub, Sector 62',
    City: 'Noida',
    State: 'Uttar Pradesh',
    Status: 'Active',
    CreatedDate: '2026-02-01T10:00:00.000Z',
    CreatedBy: 'user-sales-1',
    ModifiedDate: '2026-02-15T11:30:00.000Z'
  },
  {
    CustomerId: 'cust-102',
    CustomerCode: 'CUST-00102',
    CustomerName: 'Zenith Logistics International',
    Email: 'contact@zenithlogistics.in',
    Phone: '9123456780',
    CompanyName: 'Zenith Logistics',
    Address: '15 Harbor Industrial Park',
    City: 'Mumbai',
    State: 'Maharashtra',
    Status: 'Active',
    CreatedDate: '2026-02-05T14:15:00.000Z',
    CreatedBy: 'user-sales-2',
    ModifiedDate: '2026-02-20T09:45:00.000Z'
  },
  {
    CustomerId: 'cust-103',
    CustomerCode: 'CUST-00103',
    CustomerName: 'Starlight Healthcare Systems',
    Email: 'billing@starlighthealth.com',
    Phone: '9811223344',
    CompanyName: 'Starlight Healthcare',
    Address: '88 Medi-City Boulevard',
    City: 'Bengaluru',
    State: 'Karnataka',
    Status: 'Active',
    CreatedDate: '2026-02-10T16:00:00.000Z',
    CreatedBy: 'user-sales-1',
    ModifiedDate: '2026-03-01T12:00:00.000Z'
  },
  {
    CustomerId: 'cust-104',
    CustomerCode: 'CUST-00104',
    CustomerName: 'Vanguard Retail Enterprises',
    Email: 'operations@vanguardretail.org',
    Phone: '9765432109',
    CompanyName: 'Vanguard Retail',
    Address: '12 Commercial Ring Road',
    City: 'Delhi',
    State: 'Delhi',
    Status: 'Prospect',
    CreatedDate: '2026-02-18T11:20:00.000Z',
    CreatedBy: 'user-sales-2',
    ModifiedDate: '2026-02-18T11:20:00.000Z'
  }
];

const initialLeads = [
  {
    LeadId: 'lead-201',
    LeadCode: 'LEAD-00201',
    LeadName: 'Vikram Malhotra',
    Email: 'vikram@omnicorp.co',
    Phone: '9845012345',
    CompanyName: 'OmniCorp Technologies',
    Source: 'Website Inquiry',
    Status: 'Qualified',
    Priority: 'High',
    ExpectedValue: 450000,
    CreatedDate: '2026-02-10T08:30:00.000Z',
    AssignedTo: 'user-sales-1'
  },
  {
    LeadId: 'lead-202',
    LeadCode: 'LEAD-00202',
    LeadName: 'Ananya Deshmukh',
    Email: 'ananya@fintechpulse.io',
    Phone: '9890123456',
    CompanyName: 'Fintech Pulse Inc',
    Source: 'LinkedIn Campaign',
    Status: 'Contacted',
    Priority: 'High',
    ExpectedValue: 750000,
    CreatedDate: '2026-02-14T09:15:00.000Z',
    AssignedTo: 'user-sales-2'
  },
  {
    LeadId: 'lead-203',
    LeadCode: 'LEAD-00203',
    LeadName: 'Karthik Raman',
    Email: 'karthik@greengrid.in',
    Phone: '9731234567',
    CompanyName: 'GreenGrid Renewables',
    Source: 'Referral',
    Status: 'New',
    Priority: 'Medium',
    ExpectedValue: 320000,
    CreatedDate: '2026-02-22T13:45:00.000Z',
    AssignedTo: 'user-sales-1'
  },
  {
    LeadId: 'lead-204',
    LeadCode: 'LEAD-00204',
    LeadName: 'Rohan Mehta',
    Email: 'rohan@urbanmatrix.com',
    Phone: '9820011223',
    CompanyName: 'UrbanMatrix Infrastructure',
    Source: 'Cold Outreach',
    Status: 'Converted',
    Priority: 'High',
    ExpectedValue: 890000,
    CreatedDate: '2026-01-20T10:00:00.000Z',
    AssignedTo: 'user-sales-2'
  },
  {
    LeadId: 'lead-205',
    LeadCode: 'LEAD-00205',
    LeadName: 'Deepak Singhania',
    Email: 'deepak@singhaniapipes.com',
    Phone: '9910022334',
    CompanyName: 'Singhania Industrial Pipes',
    Source: 'Trade Show',
    Status: 'Lost',
    Priority: 'Low',
    ExpectedValue: 180000,
    CreatedDate: '2026-01-15T11:00:00.000Z',
    AssignedTo: 'user-sales-1'
  }
];

const initialOpportunities = [
  {
    OpportunityId: 'opp-301',
    OpportunityName: 'Enterprise CRM Migration & SLA',
    CustomerId: 'cust-101',
    LeadId: null,
    Amount: 850000,
    Stage: 'Proposal',
    Probability: 75,
    ExpectedCloseDate: '2026-11-20',
    Status: 'Open',
    CreatedDate: '2026-02-12T10:00:00.000Z',
    AssignedTo: 'user-sales-1',
    Notes: 'Client interested in high-availability enterprise tier with 99.9% uptime SLA.'
  },
  {
    OpportunityId: 'opp-302',
    OpportunityName: 'Omni-Channel Fleet Tracking Integration',
    CustomerId: 'cust-102',
    LeadId: null,
    Amount: 1200000,
    Stage: 'Negotiation',
    Probability: 85,
    ExpectedCloseDate: '2026-11-15',
    Status: 'Open',
    CreatedDate: '2026-02-18T14:00:00.000Z',
    AssignedTo: 'user-sales-2',
    Notes: 'Negotiation on payment schedules and custom API endpoints.'
  },
  {
    OpportunityId: 'opp-303',
    OpportunityName: 'Hospital Telehealth Module Rollout',
    CustomerId: 'cust-103',
    LeadId: null,
    Amount: 640000,
    Stage: 'Qualification',
    Probability: 40,
    ExpectedCloseDate: '2026-12-05',
    Status: 'Open',
    CreatedDate: '2026-02-25T16:30:00.000Z',
    AssignedTo: 'user-sales-1',
    Notes: 'Initial technical feasibility call completed successfully.'
  },
  {
    OpportunityId: 'opp-304',
    OpportunityName: 'Retail Supply Chain Analytics',
    CustomerId: 'cust-104',
    LeadId: null,
    Amount: 950000,
    Stage: 'Won',
    Probability: 100,
    ExpectedCloseDate: '2026-10-01',
    Status: 'Won',
    CreatedDate: '2026-01-25T11:00:00.000Z',
    AssignedTo: 'user-sales-2',
    Notes: 'Contract signed and advance payment received.'
  },
  {
    OpportunityId: 'opp-305',
    OpportunityName: 'Legacy ERP Sync Extension',
    CustomerId: 'cust-101',
    LeadId: null,
    Amount: 280000,
    Stage: 'Lost',
    Probability: 0,
    ExpectedCloseDate: '2026-09-15',
    Status: 'Lost',
    CreatedDate: '2026-01-10T12:00:00.000Z',
    AssignedTo: 'user-sales-1',
    Notes: 'Client opted for an internal bespoke script due to budget constraints.'
  }
];

const initialFollowUps = [
  {
    FollowUpId: 'flw-401',
    CustomerId: 'cust-101',
    LeadId: null,
    FollowUpDate: '2026-10-15',
    FollowUpType: 'Meeting',
    Remarks: 'Demo meeting with Head of IT for migration roadmap review.',
    Status: 'Planned',
    AssignedTo: 'user-sales-1'
  },
  {
    FollowUpId: 'flw-402',
    CustomerId: null,
    LeadId: 'lead-201',
    FollowUpDate: '2026-10-12',
    FollowUpType: 'Call',
    Remarks: 'Follow-up on pricing proposal sent last Thursday.',
    Status: 'Planned',
    AssignedTo: 'user-sales-1'
  },
  {
    FollowUpId: 'flw-403',
    CustomerId: 'cust-102',
    LeadId: null,
    FollowUpDate: '2026-10-05',
    FollowUpType: 'Email',
    Remarks: 'Sent contract addendum regarding liability clauses.',
    Status: 'Missed',
    AssignedTo: 'user-sales-2'
  },
  {
    FollowUpId: 'flw-404',
    CustomerId: 'cust-103',
    LeadId: null,
    FollowUpDate: '2026-09-28',
    FollowUpType: 'Call',
    Remarks: 'Discussed compliance and HIPAA/DISHA data requirements.',
    Status: 'Completed',
    AssignedTo: 'user-sales-1'
  }
];

const initialActivities = [
  {
    ActivityId: 'act-501',
    ActivityType: 'Call',
    Subject: 'Initial Qualification Call',
    Description: 'Discussed cloud migration timelines and user license counts.',
    ActivityDate: '2026-02-11T11:00:00.000Z',
    CustomerId: 'cust-101',
    LeadId: null,
    AssignedTo: 'user-sales-1',
    Status: 'Completed'
  },
  {
    ActivityId: 'act-502',
    ActivityType: 'Meeting',
    Subject: 'Contract Terms Review',
    Description: 'Executive presentation to Chief Logistics Officer.',
    ActivityDate: '2026-02-19T15:30:00.000Z',
    CustomerId: 'cust-102',
    LeadId: null,
    AssignedTo: 'user-sales-2',
    Status: 'Completed'
  },
  {
    ActivityId: 'act-503',
    ActivityType: 'Email',
    Subject: 'Proposal Submission v1.2',
    Description: 'Sent commercial proposal with tiered volume pricing.',
    ActivityDate: '2026-02-26T17:00:00.000Z',
    CustomerId: 'cust-103',
    LeadId: null,
    AssignedTo: 'user-sales-1',
    Status: 'Completed'
  },
  {
    ActivityId: 'act-504',
    ActivityType: 'Task',
    Subject: 'Prepare Security Clearance Dossier',
    Description: 'Compile ISO 27001 certifications and architecture diagrams.',
    ActivityDate: '2026-10-20T10:00:00.000Z',
    CustomerId: 'cust-101',
    LeadId: null,
    AssignedTo: 'user-sales-1',
    Status: 'Planned'
  }
];

const initialAuditLogs = [
  {
    AuditLogId: 'audit-001',
    UserId: 'user-admin',
    Action: 'Login',
    EntityName: 'Authentication',
    RecordId: 'user-admin',
    OldValue: null,
    NewValue: 'Successful login from administrative console',
    CreatedDate: '2026-10-08T08:00:00.000Z',
    IpAddress: '127.0.0.1'
  },
  {
    AuditLogId: 'audit-002',
    UserId: 'user-sales-1',
    Action: 'Create',
    EntityName: 'Customer',
    RecordId: 'cust-101',
    OldValue: null,
    NewValue: JSON.stringify({ CustomerCode: 'CUST-00101', Name: 'Apex Cloud Solutions' }),
    CreatedDate: '2026-02-01T10:00:00.000Z',
    IpAddress: '192.168.1.45'
  },
  {
    AuditLogId: 'audit-003',
    UserId: 'user-sales-2',
    Action: 'Update',
    EntityName: 'Opportunity',
    RecordId: 'opp-302',
    OldValue: JSON.stringify({ Stage: 'Proposal', Probability: 60 }),
    NewValue: JSON.stringify({ Stage: 'Negotiation', Probability: 85 }),
    CreatedDate: '2026-02-18T14:00:00.000Z',
    IpAddress: '192.168.1.52'
  }
];

module.exports = {
  initialRoles,
  initialUsers,
  initialCustomers,
  initialLeads,
  initialOpportunities,
  initialFollowUps,
  initialActivities,
  initialAuditLogs
};
