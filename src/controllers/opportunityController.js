const db = require('../database/db');

exports.getOpportunities = (req, res) => {
  const { search, stage, status } = req.query;
  let opps = db.getOpportunities(req.user);

  if (stage && stage !== 'All') {
    opps = opps.filter(o => o.Stage.toLowerCase() === stage.toLowerCase());
  }

  if (status && status !== 'All') {
    opps = opps.filter(o => o.Status.toLowerCase() === status.toLowerCase());
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    opps = opps.filter(o => {
      const cust = db.getCustomerById(o.CustomerId);
      const custName = cust ? cust.CustomerName.toLowerCase() : '';
      return (
        o.OpportunityName.toLowerCase().includes(q) ||
        custName.includes(q) ||
        (o.Notes && o.Notes.toLowerCase().includes(q))
      );
    });
  }

  // Populate Customer details & derive weighted pipeline: Amount * Probability / 100
  const enriched = opps.map(o => {
    const cust = db.getCustomerById(o.CustomerId);
    return {
      ...o,
      CustomerName: cust ? cust.CustomerName : 'Unassigned Customer',
      WeightedAmount: Math.round((o.Amount * o.Probability) / 100)
    };
  });

  res.status(200).json({
    success: true,
    count: enriched.length,
    data: enriched
  });
};

exports.getOpportunityById = (req, res) => {
  const opp = db.getOpportunityById(req.params.id);
  if (!opp) {
    return res.status(404).json({ success: false, message: 'Opportunity not found.' });
  }

  if (req.user.RoleName === 'SalesExecutive' && opp.AssignedTo !== req.user.UserId) {
    return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this opportunity.' });
  }

  const cust = db.getCustomerById(opp.CustomerId);
  res.status(200).json({
    success: true,
    data: {
      ...opp,
      CustomerName: cust ? cust.CustomerName : 'Unassigned Customer',
      WeightedAmount: Math.round((opp.Amount * opp.Probability) / 100)
    }
  });
};

exports.createOpportunity = (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const opp = db.createOpportunity(req.body, req.user.UserId);

  db.logAudit({
    userId: req.user.UserId,
    action: 'Create',
    entityName: 'Opportunity',
    recordId: opp.OpportunityId,
    oldValue: null,
    newValue: JSON.stringify({
      OpportunityName: opp.OpportunityName,
      Amount: opp.Amount,
      Probability: opp.Probability,
      Stage: opp.Stage,
      ExpectedCloseDate: opp.ExpectedCloseDate
    }),
    ipAddress: ip
  });

  res.status(201).json({
    success: true,
    message: 'Opportunity created successfully.',
    data: opp
  });
};

exports.updateOpportunity = (req, res) => {
  const oppId = req.params.id;
  const existing = db.getOpportunityById(oppId);

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Opportunity not found.' });
  }

  if (req.user.RoleName === 'SalesExecutive' && existing.AssignedTo !== req.user.UserId) {
    return res.status(403).json({ success: false, message: 'Forbidden: You do not own this opportunity.' });
  }

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const oldSnapshot = {
    Stage: existing.Stage,
    Amount: existing.Amount,
    Probability: existing.Probability,
    Status: existing.Status
  };

  const updated = db.updateOpportunity(oppId, req.body);

  db.logAudit({
    userId: req.user.UserId,
    action: 'Update',
    entityName: 'Opportunity',
    recordId: oppId,
    oldValue: JSON.stringify(oldSnapshot),
    newValue: JSON.stringify({
      Stage: updated.Stage,
      Amount: updated.Amount,
      Probability: updated.Probability,
      Status: updated.Status
    }),
    ipAddress: ip
  });

  res.status(200).json({
    success: true,
    message: 'Opportunity updated successfully.',
    data: updated
  });
};

exports.deleteOpportunity = (req, res) => {
  const oppId = req.params.id;
  const existing = db.getOpportunityById(oppId);

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Opportunity not found.' });
  }

  if (req.user.RoleName === 'SalesExecutive') {
    return res.status(403).json({ success: false, message: 'Forbidden: Sales executives cannot delete opportunities.' });
  }

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const removed = db.deleteOpportunity(oppId);

  db.logAudit({
    userId: req.user.UserId,
    action: 'Delete',
    entityName: 'Opportunity',
    recordId: oppId,
    oldValue: JSON.stringify({ OpportunityName: removed.OpportunityName, Amount: removed.Amount }),
    newValue: 'Opportunity deleted from CRM',
    ipAddress: ip
  });

  res.status(200).json({
    success: true,
    message: 'Opportunity deleted successfully.'
  });
};
