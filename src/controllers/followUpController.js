const db = require('../database/db');

exports.getFollowUps = (req, res) => {
  const { search, status, type } = req.query;
  let followUps = db.getFollowUps(req.user);

  if (status && status !== 'All') {
    followUps = followUps.filter(f => f.Status.toLowerCase() === status.toLowerCase());
  }

  if (type && type !== 'All') {
    followUps = followUps.filter(f => f.FollowUpType.toLowerCase() === type.toLowerCase());
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    followUps = followUps.filter(f => {
      const cust = f.CustomerId ? db.getCustomerById(f.CustomerId) : null;
      const lead = f.LeadId ? db.getLeadById(f.LeadId) : null;
      const custName = cust ? cust.CustomerName.toLowerCase() : '';
      const leadName = lead ? lead.LeadName.toLowerCase() : '';
      return (
        (f.Remarks && f.Remarks.toLowerCase().includes(q)) ||
        custName.includes(q) ||
        leadName.includes(q) ||
        f.FollowUpType.toLowerCase().includes(q)
      );
    });
  }

  // Enrich with Customer/Lead names and calculate overdue flag
  const todayStr = new Date().toISOString().split('T')[0];
  const enriched = followUps.map(f => {
    const cust = f.CustomerId ? db.getCustomerById(f.CustomerId) : null;
    const lead = f.LeadId ? db.getLeadById(f.LeadId) : null;
    const isOverdue = f.Status === 'Planned' && f.FollowUpDate < todayStr;

    return {
      ...f,
      RelatedName: cust ? cust.CustomerName : lead ? lead.LeadName : 'Unassigned',
      RelatedType: cust ? 'Customer' : lead ? 'Lead' : 'None',
      IsOverdue: isOverdue
    };
  });

  res.status(200).json({
    success: true,
    count: enriched.length,
    data: enriched
  });
};

exports.getFollowUpById = (req, res) => {
  const followUp = db.getFollowUpById(req.params.id);
  if (!followUp) {
    return res.status(404).json({ success: false, message: 'Follow-Up not found.' });
  }

  if (req.user.RoleName === 'SalesExecutive' && followUp.AssignedTo !== req.user.UserId) {
    return res.status(403).json({ success: false, message: 'Forbidden: Access denied.' });
  }

  res.status(200).json({ success: true, data: followUp });
};

exports.createFollowUp = (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const followUp = db.createFollowUp(req.body, req.user.UserId);

  db.logAudit({
    userId: req.user.UserId,
    action: 'Create',
    entityName: 'FollowUp',
    recordId: followUp.FollowUpId,
    oldValue: null,
    newValue: JSON.stringify({
      FollowUpDate: followUp.FollowUpDate,
      Type: followUp.FollowUpType,
      Status: followUp.Status,
      Remarks: followUp.Remarks
    }),
    ipAddress: ip
  });

  res.status(201).json({
    success: true,
    message: 'Follow-up scheduled successfully.',
    data: followUp
  });
};

exports.updateFollowUp = (req, res) => {
  const followUpId = req.params.id;
  const existing = db.getFollowUpById(followUpId);

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Follow-Up not found.' });
  }

  if (req.user.RoleName === 'SalesExecutive' && existing.AssignedTo !== req.user.UserId) {
    return res.status(403).json({ success: false, message: 'Forbidden: Access denied.' });
  }

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const oldSnapshot = { Status: existing.Status, FollowUpDate: existing.FollowUpDate };
  const updated = db.updateFollowUp(followUpId, req.body);

  db.logAudit({
    userId: req.user.UserId,
    action: 'Update',
    entityName: 'FollowUp',
    recordId: followUpId,
    oldValue: JSON.stringify(oldSnapshot),
    newValue: JSON.stringify({ Status: updated.Status, FollowUpDate: updated.FollowUpDate }),
    ipAddress: ip
  });

  res.status(200).json({
    success: true,
    message: 'Follow-up updated successfully.',
    data: updated
  });
};

exports.deleteFollowUp = (req, res) => {
  const followUpId = req.params.id;
  const existing = db.getFollowUpById(followUpId);

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Follow-Up not found.' });
  }

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  db.deleteFollowUp(followUpId);

  db.logAudit({
    userId: req.user.UserId,
    action: 'Delete',
    entityName: 'FollowUp',
    recordId: followUpId,
    oldValue: JSON.stringify({ Subject: existing.Remarks, Date: existing.FollowUpDate }),
    newValue: 'Follow-up deleted',
    ipAddress: ip
  });

  res.status(200).json({
    success: true,
    message: 'Follow-up deleted successfully.'
  });
};
