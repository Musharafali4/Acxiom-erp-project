const db = require('../database/db');

exports.getCustomers = (req, res) => {
  const { search, status } = req.query;
  let customers = db.getCustomers(req.user);

  if (status && status !== 'All') {
    customers = customers.filter(c => c.Status.toLowerCase() === status.toLowerCase());
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    customers = customers.filter(c =>
      c.CustomerName.toLowerCase().includes(q) ||
      c.Email.toLowerCase().includes(q) ||
      c.Phone.includes(q) ||
      (c.CompanyName && c.CompanyName.toLowerCase().includes(q)) ||
      (c.CustomerCode && c.CustomerCode.toLowerCase().includes(q))
    );
  }

  res.status(200).json({
    success: true,
    count: customers.length,
    data: customers
  });
};

exports.getCustomerById = (req, res) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer record not found.'
    });
  }

  // Check role authorization scope
  if (req.user.RoleName === 'SalesExecutive' && customer.CreatedBy !== req.user.UserId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have access to view this customer record.'
    });
  }

  // Attach related items
  const followUps = db.data.followUps.filter(f => f.CustomerId === customer.CustomerId);
  const opportunities = db.data.opportunities.filter(o => o.CustomerId === customer.CustomerId);
  const activities = db.data.activities.filter(a => a.CustomerId === customer.CustomerId);

  res.status(200).json({
    success: true,
    data: {
      ...customer,
      followUps,
      opportunities,
      activities
    }
  });
};

exports.createCustomer = (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const customer = db.createCustomer(req.body, req.user.UserId);

  db.logAudit({
    userId: req.user.UserId,
    action: 'Create',
    entityName: 'Customer',
    recordId: customer.CustomerId,
    oldValue: null,
    newValue: JSON.stringify({
      CustomerCode: customer.CustomerCode,
      CustomerName: customer.CustomerName,
      Email: customer.Email,
      Phone: customer.Phone,
      Company: customer.CompanyName
    }),
    ipAddress: ip
  });

  res.status(201).json({
    success: true,
    message: 'Customer record created successfully.',
    data: customer
  });
};

exports.updateCustomer = (req, res) => {
  const customerId = req.params.id;
  const existing = db.getCustomerById(customerId);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Customer record not found.'
    });
  }

  if (req.user.RoleName === 'SalesExecutive' && existing.CreatedBy !== req.user.UserId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You are not authorized to update this customer.'
    });
  }

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const oldSnapshot = {
    CustomerName: existing.CustomerName,
    Email: existing.Email,
    Phone: existing.Phone,
    CompanyName: existing.CompanyName,
    Status: existing.Status
  };

  const updated = db.updateCustomer(customerId, req.body);

  db.logAudit({
    userId: req.user.UserId,
    action: 'Update',
    entityName: 'Customer',
    recordId: customerId,
    oldValue: JSON.stringify(oldSnapshot),
    newValue: JSON.stringify({
      CustomerName: updated.CustomerName,
      Email: updated.Email,
      Phone: updated.Phone,
      CompanyName: updated.CompanyName,
      Status: updated.Status
    }),
    ipAddress: ip
  });

  res.status(200).json({
    success: true,
    message: 'Customer updated successfully.',
    data: updated
  });
};

exports.deleteCustomer = (req, res) => {
  const customerId = req.params.id;
  const existing = db.getCustomerById(customerId);

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Customer record not found.'
    });
  }

  if (req.user.RoleName === 'SalesExecutive') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Sales executives are not permitted to delete customer records.'
    });
  }

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const removed = db.deleteCustomer(customerId);

  db.logAudit({
    userId: req.user.UserId,
    action: 'Delete',
    entityName: 'Customer',
    recordId: customerId,
    oldValue: JSON.stringify({
      CustomerCode: removed.CustomerCode,
      CustomerName: removed.CustomerName
    }),
    newValue: 'Record deleted from CRM',
    ipAddress: ip
  });

  res.status(200).json({
    success: true,
    message: 'Customer record deleted successfully.'
  });
};
