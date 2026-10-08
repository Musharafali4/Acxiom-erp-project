const db = require('../database/db');

exports.getAuditLogs = (req, res) => {
  const { user, module: mod, action, startDate, endDate } = req.query;

  // Scoped access: Admin has full access, Manager has team/business access, SalesExecutive has no audit access
  if (req.user.RoleName === 'SalesExecutive') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Sales Executives are not permitted to inspect system audit logs.'
    });
  }

  const logs = db.getAuditLogs({
    userId: user,
    module: mod,
    action,
    startDate,
    endDate
  });

  // Enrich with user name
  const enriched = logs.map(l => {
    const userObj = db.findUserById(l.UserId);
    return {
      ...l,
      UserName: userObj ? userObj.Name : (l.UserId === 'anonymous' ? 'Anonymous / Guest' : l.UserId)
    };
  });

  res.status(200).json({
    success: true,
    count: enriched.length,
    data: enriched
  });
};
