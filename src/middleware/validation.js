const db = require('../database/db');
const config = require('../config/config');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[6-9]\d{9}$/; // Standard 10-digit mobile number format starting with 6-9

function validateCustomer(req, res, next) {
  const { CustomerName, Email, Phone } = req.body;
  const errors = [];
  const customerId = req.params.id || null;

  if (!CustomerName || !CustomerName.trim()) {
    errors.push('Customer Name is required.');
  } else if (CustomerName.trim().length > 100) {
    errors.push('Customer Name cannot exceed 100 characters.');
  }

  if (!Email || !Email.trim()) {
    errors.push('Email is required.');
  } else if (!emailRegex.test(Email.trim())) {
    errors.push('Enter a valid email address.');
  } else {
    // Check uniqueness
    const existing = db.findCustomerByEmail(Email.trim(), customerId);
    if (existing) {
      errors.push('A customer with this email address already exists.');
    }
  }

  if (!Phone || !Phone.trim()) {
    errors.push('Phone is required.');
  } else {
    const cleanPhone = Phone.trim().replace(/[^0-9]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Enter a valid phone number (10-digit mobile format).');
    } else {
      // Check phone uniqueness
      const existingPhone = db.findCustomerByPhone(cleanPhone, customerId);
      if (existingPhone) {
        errors.push('A customer with this phone number already exists.');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

function validateLead(req, res, next) {
  const { LeadName, Email, Phone, Status, ExpectedValue } = req.body;
  const errors = [];

  if (!LeadName || !LeadName.trim()) {
    errors.push('Lead Name is required.');
  }

  if (Email && Email.trim() && !emailRegex.test(Email.trim())) {
    errors.push('Enter a valid email address.');
  }

  if (Phone && Phone.trim()) {
    const cleanPhone = Phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      errors.push('Enter a valid phone number.');
    }
  }

  if (Status && !config.LEAD_STATUSES.includes(Status)) {
    errors.push(`Invalid Lead Status. Allowed statuses are: ${config.LEAD_STATUSES.join(', ')}`);
  }

  if (ExpectedValue !== undefined && ExpectedValue !== null && ExpectedValue !== '') {
    const num = Number(ExpectedValue);
    if (isNaN(num) || num < 0) {
      errors.push('Expected Value must be a valid positive number.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

function validateOpportunity(req, res, next) {
  const { OpportunityName, Amount, Probability, ExpectedCloseDate, Stage } = req.body;
  const errors = [];

  if (!OpportunityName || !OpportunityName.trim()) {
    errors.push('Opportunity Name is required.');
  }

  const numAmount = Number(Amount);
  if (Amount === undefined || Amount === null || isNaN(numAmount)) {
    errors.push('Opportunity Amount is required.');
  } else if (numAmount <= 0) {
    errors.push('Opportunity Amount must be greater than 0.');
  }

  const numProb = Number(Probability);
  if (Probability === undefined || Probability === null || isNaN(numProb)) {
    errors.push('Probability is required.');
  } else if (numProb < 0 || numProb > 100) {
    errors.push('Probability must be between 0 and 100.');
  }

  if (Stage && !config.OPPORTUNITY_STAGES.includes(Stage)) {
    errors.push(`Invalid Opportunity Stage. Allowed stages: ${config.OPPORTUNITY_STAGES.join(', ')}`);
  }

  // Active opportunities cannot have ExpectedCloseDate in past
  if (!ExpectedCloseDate) {
    errors.push('Expected Close Date is required.');
  } else {
    const closeDate = new Date(ExpectedCloseDate + 'T23:59:59');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isClosed = Stage === 'Won' || Stage === 'Lost';
    if (!isClosed && closeDate < today) {
      errors.push('Expected Close Date cannot be in the past.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

function validateFollowUp(req, res, next) {
  const { FollowUpDate, FollowUpType, Status } = req.body;
  const errors = [];

  if (!FollowUpDate) {
    errors.push('Follow-Up Date is required.');
  } else {
    const followDate = new Date(FollowUpDate + 'T23:59:59');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isHistorical = Status === 'Completed' || Status === 'Missed';
    if (!isHistorical && followDate < today) {
      errors.push('Follow-up date cannot be earlier than today.');
    }
  }

  if (FollowUpType && !config.FOLLOWUP_TYPES.includes(FollowUpType)) {
    errors.push(`Follow-Up Type must be one of: ${config.FOLLOWUP_TYPES.join(', ')}`);
  }

  if (Status && !config.FOLLOWUP_STATUSES.includes(Status)) {
    errors.push(`Status must be one of: ${config.FOLLOWUP_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

function validatePasswordPolicy(password) {
  const errors = [];
  if (!password || password.length < config.PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${config.PASSWORD_POLICY.minLength} characters long.`);
  }
  if (config.PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (config.PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (config.PASSWORD_POLICY.requireDigit && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit.');
  }
  if (config.PASSWORD_POLICY.requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }
  return errors;
}

module.exports = {
  validateCustomer,
  validateLead,
  validateOpportunity,
  validateFollowUp,
  validatePasswordPolicy
};
