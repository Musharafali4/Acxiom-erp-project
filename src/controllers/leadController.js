const db = require('../database/db');

exports.getLeads = (req, res) => {
  const { search, status, priority } = req.query;
  let leads = db.getLeads(req.user);

  if (status && status !== 'All') {
    leads = leads.filter(l => l.Status.toLowerCase() === status.toLowerCase());
  }

  if (priority && priority !== 'All') {
    leads = leads.filter(l => l.Priority.toLowerCase() === priority.toLowerCase());
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    leads = leads.filter(l =>
      l.LeadName.toLowerCase().includes(q) ||
      (l.Email && l.Email.toLowerCase().includes(q)) ||
      (l.Phone && l.Phone.includes(q)) ||
      (l.CompanyName && l.CompanyName.toLowerCase().includes(q)) ||
      (l.LeadCode && l.LeadCode.toLowerCase().includes(q))
    );
  }

  res.status(200).json({
    success: true,
    count: leads.length,
    data: leads
  });
};

exports.getLeadById = (req, res) => {
  const lead = db.getLeadById(req.params.id);
  if (!lead) {
    return res.status(404).json({ success: false, message: 'Lead not found.' });
  }

  if (req.user.RoleName === 'SalesExecutive' && lead.AssignedTo !== req.user.UserId) {
    return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this lead.' });
  }

  res.status(200).json({ success: true, data: lead });
};

exports.createLead = (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const lead = db.createLead(req.body, req.user.UserId);

  db.logAudit({
    userId: req.user.UserId,
    action: 'Create',
    entityName: 'Lead',
    recordId: lead.LeadId,
    oldValue: null,
    newValue: JSON.stringify({
      LeadCode: lead.LeadCode,
      LeadName: lead.LeadName,
      Status: lead.Status,
      ExpectedValue: lead.ExpectedValue
    }),
    ipAddress: ip
  });

  res.status(201).json({
    success: true,
    message: 'Lead created successfully.',
    data: lead
  });
};

exports.updateLead = (req, res) => {
  const leadId = req.params.id;
  const existing = db.getLeadById(leadId);

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Lead not found.' });
  }

  if (req.user.RoleName === 'SalesExecutive' && existing.AssignedTo !== req.user.UserId) {
    return res.status(403).json({ success: false, message: 'Forbidden: You do not own this lead.' });
  }

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const oldSnapshot = { ...existing };
  const updated = db.updateLead(leadId, req.body);

  db.logAudit({
    userId: req.user.UserId,
    action: 'Update',
    entityName: 'Lead',
    recordId: leadId,
    oldValue: JSON.stringify({
      Status: oldSnapshot.Status,
      Priority: oldSnapshot.Priority,
      ExpectedValue: oldSnapshot.ExpectedValue
    }),
    newValue: JSON.stringify({
      Status: updated.Status,
      Priority: updated.Priority,
      ExpectedValue: updated.ExpectedValue
    }),
    ipAddress: ip
  });

  res.status(200).json({
    success: true,
    message: 'Lead updated successfully.',
    data: updated
  });
};

exports.deleteLead = (req, res) => {
  const leadId = req.params.id;
  const existing = db.getLeadById(leadId);

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Lead not found.' });
  }

  if (req.user.RoleName === 'SalesExecutive') {
    return res.status(403).json({ success: false, message: 'Forbidden: Sales executives cannot delete leads.' });
  }

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const removed = db.deleteLead(leadId);

  db.logAudit({
    userId: req.user.UserId,
    action: 'Delete',
    entityName: 'Lead',
    recordId: leadId,
    oldValue: JSON.stringify({ LeadCode: removed.LeadCode, LeadName: removed.LeadName }),
    newValue: 'Lead deleted from CRM',
    ipAddress: ip
  });

  res.status(200).json({
    success: true,
    message: 'Lead deleted successfully.'
  });
};

exports.convertLead = (req, res) => {
  const leadId = req.params.id;
  const lead = db.getLeadById(leadId);

  if (!lead) {
    return res.status(404).json({ success: false, message: 'Lead not found.' });
  }

  if (lead.Status === 'Converted') {
    return res.status(400).json({
      success: false,
      message: 'This lead has already been converted.'
    });
  }

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const { createOpportunity, opportunityAmount, expectedCloseDate } = req.body;

  // 1. Create or link customer
  let customer = db.findCustomerByEmail(lead.Email);
  if (!customer) {
    customer = db.createCustomer({
      CustomerName: lead.LeadName,
      Email: lead.Email || `contact_${lead.LeadCode.toLowerCase()}@example.com`,
      Phone: lead.Phone || '9876543210',
      CompanyName: lead.CompanyName || lead.LeadName,
      Status: 'Active'
    }, req.user.UserId);
  }

  // 2. Optionally create opportunity
  let opportunity = null;
  if (createOpportunity) {
    const oppAmount = Number(opportunityAmount) || lead.ExpectedValue || 100000;
    const today = new Date();
    today.setDate(today.getDate() + 30);
    const defaultClose = today.toISOString().split('T')[0];

    opportunity = db.createOpportunity({
      OpportunityName: `${lead.CompanyName || lead.LeadName} - Deal`,
      CustomerId: customer.CustomerId,
      LeadId: lead.LeadId,
      Amount: oppAmount,
      Stage: 'Qualification',
      Probability: 50,
      ExpectedCloseDate: expectedCloseDate || defaultClose,
      Notes: `Converted from lead ${lead.LeadCode} (${lead.LeadName})`
    }, req.user.UserId);
  }

  // 3. Update lead status to Converted
  db.updateLead(leadId, { Status: 'Converted' });

  // 4. Log audit for lead conversion
  db.logAudit({
    userId: req.user.UserId,
    action: 'Lead Conversion',
    entityName: 'Lead',
    recordId: leadId,
    oldValue: JSON.stringify({ Status: lead.Status }),
    newValue: JSON.stringify({
      Status: 'Converted',
      CustomerId: customer.CustomerId,
      OpportunityId: opportunity ? opportunity.OpportunityId : null
    }),
    ipAddress: ip
  });

  res.status(200).json({
    success: true,
    message: 'Lead successfully converted to Customer and Opportunity!',
    data: {
      customer,
      opportunity
    }
  });
};
