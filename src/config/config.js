const config = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'AcxiomCRM_Enterprise_Secure_Secret_Key_2026_@!#$',
  JWT_EXPIRY: '8h',
  PASSWORD_POLICY: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecial: true,
    description: 'Minimum 8 characters with at least one uppercase letter, one lowercase letter, one digit, and one special character.'
  },
  LOCKOUT_POLICY: {
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15
  },
  ROLES: {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    SALES_EXECUTIVE: 'SalesExecutive'
  },
  LEAD_STATUSES: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Lost'],
  OPPORTUNITY_STAGES: ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'],
  FOLLOWUP_STATUSES: ['Planned', 'Completed', 'Missed', 'Cancelled'],
  FOLLOWUP_TYPES: ['Call', 'Meeting', 'Email', 'Visit'],
  ACTIVITY_TYPES: ['Call', 'Meeting', 'Email', 'Task']
};

module.exports = config;
