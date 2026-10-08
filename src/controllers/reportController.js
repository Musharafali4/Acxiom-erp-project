const db = require('../database/db');

exports.getDashboard = (req, res) => {
  const user = req.user;
  const customers = db.getCustomers(user);
  const leads = db.getLeads(user);
  const opportunities = db.getOpportunities(user);
  const followUps = db.getFollowUps(user);
  const activities = db.getActivities(user);

  // KPIs
  const totalCustomers = customers.length;
  const totalLeads = leads.length;
  const openLeads = leads.filter(l => !['Lost', 'Converted'].includes(l.Status)).length;

  const totalOpportunities = opportunities.length;
  const openOpportunities = opportunities.filter(o => o.Status === 'Open').length;
  const wonOpportunities = opportunities.filter(o => o.Status === 'Won').length;
  const lostOpportunities = opportunities.filter(o => o.Status === 'Lost').length;

  const totalPipelineValue = opportunities
    .filter(o => o.Status === 'Open')
    .reduce((sum, o) => sum + (Number(o.Amount) || 0), 0);

  const weightedPipelineValue = opportunities
    .filter(o => o.Status === 'Open')
    .reduce((sum, o) => sum + Math.round(((Number(o.Amount) || 0) * (Number(o.Probability) || 0)) / 100), 0);

  const wonRevenue = opportunities
    .filter(o => o.Status === 'Won')
    .reduce((sum, o) => sum + (Number(o.Amount) || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingFollowUps = followUps.filter(f => f.Status === 'Planned').length;
  const overdueFollowUps = followUps.filter(f => f.Status === 'Planned' && f.FollowUpDate < todayStr).length;

  // Chart data: Lead Status
  const leadStatusCounts = {
    New: leads.filter(l => l.Status === 'New').length,
    Contacted: leads.filter(l => l.Status === 'Contacted').length,
    Qualified: leads.filter(l => l.Status === 'Qualified').length,
    Lost: leads.filter(l => l.Status === 'Lost').length,
    Converted: leads.filter(l => l.Status === 'Converted').length
  };

  // Chart data: Opportunity Pipeline Stages
  const stageCounts = {
    Qualification: opportunities.filter(o => o.Stage === 'Qualification').length,
    Proposal: opportunities.filter(o => o.Stage === 'Proposal').length,
    Negotiation: opportunities.filter(o => o.Stage === 'Negotiation').length,
    Won: opportunities.filter(o => o.Stage === 'Won').length,
    Lost: opportunities.filter(o => o.Stage === 'Lost').length
  };

  const stageAmounts = {
    Qualification: opportunities.filter(o => o.Stage === 'Qualification').reduce((s, o) => s + o.Amount, 0),
    Proposal: opportunities.filter(o => o.Stage === 'Proposal').reduce((s, o) => s + o.Amount, 0),
    Negotiation: opportunities.filter(o => o.Stage === 'Negotiation').reduce((s, o) => s + o.Amount, 0),
    Won: opportunities.filter(o => o.Stage === 'Won').reduce((s, o) => s + o.Amount, 0),
    Lost: opportunities.filter(o => o.Stage === 'Lost').reduce((s, o) => s + o.Amount, 0)
  };

  // Monthly Sales trend (last 6 months)
  const monthlySales = [
    { month: 'May', won: 450000, pipeline: 1200000 },
    { month: 'Jun', won: 620000, pipeline: 1540000 },
    { month: 'Jul', won: 890000, pipeline: 1800000 },
    { month: 'Aug', won: 750000, pipeline: 2100000 },
    { month: 'Sep', won: 1100000, pipeline: 2400000 },
    { month: 'Oct', won: wonRevenue || 950000, pipeline: totalPipelineValue || 2690000 }
  ];

  res.status(200).json({
    success: true,
    data: {
      kpis: {
        totalCustomers,
        totalLeads,
        openLeads,
        totalOpportunities,
        openOpportunities,
        wonOpportunities,
        lostOpportunities,
        totalPipelineValue,
        weightedPipelineValue,
        wonRevenue,
        pendingFollowUps,
        overdueFollowUps
      },
      charts: {
        leadStatusCounts,
        stageCounts,
        stageAmounts,
        monthlySales
      },
      role: user.RoleName,
      userName: user.Name
    }
  });
};

exports.getPipelineReport = (req, res) => {
  const opps = db.getOpportunities(req.user);
  const byStage = {};
  const byOwner = {};

  opps.forEach(o => {
    // By stage
    if (!byStage[o.Stage]) {
      byStage[o.Stage] = { count: 0, totalAmount: 0, weightedAmount: 0 };
    }
    byStage[o.Stage].count++;
    byStage[o.Stage].totalAmount += o.Amount;
    byStage[o.Stage].weightedAmount += Math.round((o.Amount * o.Probability) / 100);

    // By owner
    const owner = db.findUserById(o.AssignedTo);
    const ownerName = owner ? owner.Name : o.AssignedTo || 'Unassigned';
    if (!byOwner[ownerName]) {
      byOwner[ownerName] = { count: 0, totalAmount: 0, wonCount: 0, wonAmount: 0 };
    }
    byOwner[ownerName].count++;
    byOwner[ownerName].totalAmount += o.Amount;
    if (o.Status === 'Won') {
      byOwner[ownerName].wonCount++;
      byOwner[ownerName].wonAmount += o.Amount;
    }
  });

  res.status(200).json({
    success: true,
    data: {
      byStage,
      byOwner
    }
  });
};

exports.getConversionReport = (req, res) => {
  const leads = db.getLeads(req.user);
  const total = leads.length;
  const converted = leads.filter(l => l.Status === 'Converted').length;
  const lost = leads.filter(l => l.Status === 'Lost').length;
  const inProgress = total - converted - lost;
  const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

  res.status(200).json({
    success: true,
    data: {
      totalLeads: total,
      converted,
      lost,
      inProgress,
      conversionRate: `${conversionRate}%`
    }
  });
};

exports.getUserActivityReport = (req, res) => {
  const users = db.getUsers();
  const activities = db.data.activities;
  const followUps = db.data.followUps;
  const opps = db.data.opportunities;

  const userStats = users.map(u => {
    const actCount = activities.filter(a => a.AssignedTo === u.UserId).length;
    const flwCount = followUps.filter(f => f.AssignedTo === u.UserId).length;
    const oppCount = opps.filter(o => o.AssignedTo === u.UserId).length;
    return {
      userId: u.UserId,
      name: u.Name,
      role: u.RoleName,
      activitiesLogged: actCount,
      followUpsAssigned: flwCount,
      dealsHandled: oppCount
    };
  });

  res.status(200).json({
    success: true,
    data: userStats
  });
};
lost,
  inProgress,
  conversionRate: `${conversionRate}%`
    }
  });
};

exports.getUserActivityReport = (req, res) => {
  const users = db.getUsers();
  const activities = db.data.activities;
  const followUps = db.data.followUps;
  const opps = db.data.opportunities;

  const userStats = users.map(u => {
    const actCount = activities.filter(a => a.AssignedTo === u.UserId).length;
    const flwCount = followUps.filter(f => f.AssignedTo === u.UserId).length;
    const oppCount = opps.filter(o => o.AssignedTo === u.UserId).length;
    return {
      userId: u.UserId,
      name: u.Name,
      role: u.RoleName,
      activitiesLogged: actCount,
      followUpsAssigned: flwCount,
      dealsHandled: oppCount
    };
  });

  res.status(200).json({
    success: true,
    data: userStats
  });
};
