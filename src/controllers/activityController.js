const db = require('../database/db');

exports.getActivities = (req, res) => {
  const { type, status, search } = req.query;
  let activities = db.getActivities(req.user);

  if (type && type !== 'All') {
    activities = activities.filter(a => a.ActivityType.toLowerCase() === type.toLowerCase());
  }

  if (status && status !== 'All') {
    activities = activities.filter(a => a.Status.toLowerCase() === status.toLowerCase());
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    activities = activities.filter(a =>
      a.Subject.toLowerCase().includes(q) ||
      (a.Description && a.Description.toLowerCase().includes(q))
    );
  }

  // Enrich with related names
  const enriched = activities.map(a => {
    const cust = a.CustomerId ? db.getCustomerById(a.CustomerId) : null;
    const lead = a.LeadId ? db.getLeadById(a.LeadId) : null;
    const assignedUser = a.AssignedTo ? db.findUserById(a.AssignedTo) : null;

    return {
      ...a,
      RelatedName: cust ? cust.CustomerName : lead ? lead.LeadName : 'General',
      AssignedUserName: assignedUser ? assignedUser.Name : 'System'
    };
  });

  res.status(200).json({
    success: true,
    count: enriched.length,
    data: enriched
  });
};

exports.createActivity = (req, res) => {
  const { ActivityType, Subject, Description, ActivityDate, CustomerId, LeadId } = req.body;

  if (!Subject || !Subject.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Activity Subject is required.'
    });
  }

  const activity = db.createActivity(req.body, req.user.UserId);
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';

  db.logAudit({
    userId: req.user.UserId,
    action: 'Create',
    entityName: 'Activity',
    recordId: activity.ActivityId,
    oldValue: null,
    newValue: JSON.stringify({
      Type: activity.ActivityType,
      Subject: activity.Subject,
      Date: activity.ActivityDate
    }),
    ipAddress: ip
  });

  res.status(201).json({
    success: true,
    message: 'Activity logged successfully.',
    data: activity
  });
};
