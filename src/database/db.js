const fs = require('fs');
const path = require('path');
const {
  initialRoles,
  initialUsers,
  initialCustomers,
  initialLeads,
  initialOpportunities,
  initialFollowUps,
  initialActivities,
  initialAuditLogs
} = require('./seedData');

const DB_FILE_PATH = path.join(__dirname, '..', '..', 'data', 'acxiom_crm_store.json');

class Database {
  constructor() {
    this.data = {
      roles: [],
      users: [],
      customers: [],
      leads: [],
      opportunities: [],
      followUps: [],
      activities: [],
      auditLogs: []
    };
    this.init();
  }

  init() {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Failed reading existing DB file, re-seeding...', err);
        this.seed();
      }
    } else {
      this.seed();
    }
  }

  seed() {
    this.data = {
      roles: JSON.parse(JSON.stringify(initialRoles)),
      users: JSON.parse(JSON.stringify(initialUsers)),
      customers: JSON.parse(JSON.stringify(initialCustomers)),
      leads: JSON.parse(JSON.stringify(initialLeads)),
      opportunities: JSON.parse(JSON.stringify(initialOpportunities)),
      followUps: JSON.parse(JSON.stringify(initialFollowUps)),
      activities: JSON.parse(JSON.stringify(initialActivities)),
      auditLogs: JSON.parse(JSON.stringify(initialAuditLogs))
    };
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  // --- USERS & ROLES ---
  getRoles() {
    return this.data.roles;
  }

  getRoleById(roleId) {
    return this.data.roles.find(r => r.RoleId === roleId);
  }

  getUsers() {
    // Return sanitized users (without PasswordHash)
    return this.data.users.map(({ PasswordHash, ...u }) => u);
  }

  findUserByEmail(email) {
    if (!email) return null;
    return this.data.users.find(u => u.Email.toLowerCase() === email.trim().toLowerCase());
  }

  findUserById(userId) {
    return this.data.users.find(u => u.UserId === userId);
  }

  createUser(user) {
    const newUser = {
      UserId: 'user-' + Date.now(),
      Name: user.Name,
      Email: user.Email.trim().toLowerCase(),
      PasswordHash: user.PasswordHash,
      RoleId: user.RoleId,
      RoleName: user.RoleName,
      IsActive: user.IsActive !== undefined ? user.IsActive : true,
      FailedLoginCount: 0,
      LockoutEnd: null,
      CreatedDate: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    const { PasswordHash, ...sanitized } = newUser;
    return sanitized;
  }

  updateUser(userId, updates) {
    const idx = this.data.users.findIndex(u => u.UserId === userId);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    const { PasswordHash, ...sanitized } = this.data.users[idx];
    return sanitized;
  }

  recordFailedLogin(user, lockoutMinutes = 15, maxAttempts = 5) {
    user.FailedLoginCount = (user.FailedLoginCount || 0) + 1;
    if (user.FailedLoginCount >= maxAttempts) {
      const lockoutDate = new Date();
      lockoutDate.setMinutes(lockoutDate.getMinutes() + lockoutMinutes);
      user.LockoutEnd = lockoutDate.toISOString();
    }
    this.save();
    return {
      failedCount: user.FailedLoginCount,
      isLocked: Boolean(user.LockoutEnd && new Date(user.LockoutEnd) > new Date()),
      lockoutEnd: user.LockoutEnd
    };
  }

  resetFailedLogin(user) {
    user.FailedLoginCount = 0;
    user.LockoutEnd = null;
    this.save();
  }

  // --- CUSTOMERS ---
  getCustomers(user) {
    let list = this.data.customers;
    if (user && user.RoleName === 'SalesExecutive') {
      list = list.filter(c => c.CreatedBy === user.UserId);
    }
    return list;
  }

  getCustomerById(id) {
    return this.data.customers.find(c => c.CustomerId === id);
  }

  findCustomerByEmail(email, excludeId = null) {
    if (!email) return null;
    return this.data.customers.find(
      c => c.Email.toLowerCase() === email.trim().toLowerCase() && (!excludeId || c.CustomerId !== excludeId)
    );
  }

  findCustomerByPhone(phone, excludeId = null) {
    if (!phone) return null;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return this.data.customers.find(
      c => c.Phone.replace(/[^0-9]/g, '') === cleanPhone && (!excludeId || c.CustomerId !== excludeId)
    );
  }

  createCustomer(cust, userId) {
    const code = 'CUST-' + String(this.data.customers.length + 101).padStart(5, '0');
    const newCust = {
      CustomerId: 'cust-' + Date.now(),
      CustomerCode: code,
      CustomerName: cust.CustomerName.trim(),
      Email: cust.Email.trim().toLowerCase(),
      Phone: cust.Phone.trim(),
      CompanyName: (cust.CompanyName || '').trim(),
      Address: (cust.Address || '').trim(),
      City: (cust.City || '').trim(),
      State: (cust.State || '').trim(),
      Status: cust.Status || 'Active',
      CreatedDate: new Date().toISOString(),
      CreatedBy: cust.CreatedBy || userId,
      ModifiedDate: new Date().toISOString()
    };
    this.data.customers.push(newCust);
    this.save();
    return newCust;
  }

  updateCustomer(id, updates) {
    const idx = this.data.customers.findIndex(c => c.CustomerId === id);
    if (idx === -1) return null;
    this.data.customers[idx] = {
      ...this.data.customers[idx],
      ...updates,
      ModifiedDate: new Date().toISOString()
    };
    this.save();
    return this.data.customers[idx];
  }

  deleteCustomer(id) {
    const idx = this.data.customers.findIndex(c => c.CustomerId === id);
    if (idx === -1) return null;
    const removed = this.data.customers.splice(idx, 1)[0];
    this.save();
    return removed;
  }

  // --- LEADS ---
  getLeads(user) {
    let list = this.data.leads;
    if (user && user.RoleName === 'SalesExecutive') {
      list = list.filter(l => l.AssignedTo === user.UserId);
    }
    return list;
  }

  getLeadById(id) {
    return this.data.leads.find(l => l.LeadId === id);
  }

  createLead(lead, userId) {
    const code = 'LEAD-' + String(this.data.leads.length + 201).padStart(5, '0');
    const newLead = {
      LeadId: 'lead-' + Date.now(),
      LeadCode: code,
      LeadName: lead.LeadName.trim(),
      Email: lead.Email.trim().toLowerCase(),
      Phone: lead.Phone.trim(),
      CompanyName: (lead.CompanyName || '').trim(),
      Source: lead.Source || 'Website Inquiry',
      Status: lead.Status || 'New',
      Priority: lead.Priority || 'Medium',
      ExpectedValue: Number(lead.ExpectedValue) || 0,
      CreatedDate: new Date().toISOString(),
      AssignedTo: lead.AssignedTo || userId
    };
    this.data.leads.push(newLead);
    this.save();
    return newLead;
  }

  updateLead(id, updates) {
    const idx = this.data.leads.findIndex(l => l.LeadId === id);
    if (idx === -1) return null;
    this.data.leads[idx] = { ...this.data.leads[idx], ...updates };
    this.save();
    return this.data.leads[idx];
  }

  deleteLead(id) {
    const idx = this.data.leads.findIndex(l => l.LeadId === id);
    if (idx === -1) return null;
    const removed = this.data.leads.splice(idx, 1)[0];
    this.save();
    return removed;
  }

  // --- OPPORTUNITIES ---
  getOpportunities(user) {
    let list = this.data.opportunities;
    if (user && user.RoleName === 'SalesExecutive') {
      list = list.filter(o => o.AssignedTo === user.UserId);
    }
    return list;
  }

  getOpportunityById(id) {
    return this.data.opportunities.find(o => o.OpportunityId === id);
  }

  createOpportunity(opp, userId) {
    const newOpp = {
      OpportunityId: 'opp-' + Date.now(),
      OpportunityName: opp.OpportunityName.trim(),
      CustomerId: opp.CustomerId || null,
      LeadId: opp.LeadId || null,
      Amount: Number(opp.Amount),
      Stage: opp.Stage || 'Qualification',
      Probability: Number(opp.Probability),
      ExpectedCloseDate: opp.ExpectedCloseDate,
      Status: opp.Stage === 'Won' ? 'Won' : opp.Stage === 'Lost' ? 'Lost' : 'Open',
      CreatedDate: new Date().toISOString(),
      AssignedTo: opp.AssignedTo || userId,
      Notes: (opp.Notes || '').trim()
    };
    this.data.opportunities.push(newOpp);
    this.save();
    return newOpp;
  }

  updateOpportunity(id, updates) {
    const idx = this.data.opportunities.findIndex(o => o.OpportunityId === id);
    if (idx === -1) return null;
    const existing = this.data.opportunities[idx];
    const stage = updates.Stage || existing.Stage;
    let status = existing.Status;
    if (stage === 'Won') status = 'Won';
    else if (stage === 'Lost') status = 'Lost';
    else status = 'Open';

    this.data.opportunities[idx] = {
      ...existing,
      ...updates,
      Status: status
    };
    this.save();
    return this.data.opportunities[idx];
  }

  deleteOpportunity(id) {
    const idx = this.data.opportunities.findIndex(o => o.OpportunityId === id);
    if (idx === -1) return null;
    const removed = this.data.opportunities.splice(idx, 1)[0];
    this.save();
    return removed;
  }

  // --- FOLLOW-UPS ---
  getFollowUps(user) {
    let list = this.data.followUps;
    if (user && user.RoleName === 'SalesExecutive') {
      list = list.filter(f => f.AssignedTo === user.UserId);
    }
    return list;
  }

  getFollowUpById(id) {
    return this.data.followUps.find(f => f.FollowUpId === id);
  }

  createFollowUp(flw, userId) {
    const newFlw = {
      FollowUpId: 'flw-' + Date.now(),
      CustomerId: flw.CustomerId || null,
      LeadId: flw.LeadId || null,
      FollowUpDate: flw.FollowUpDate,
      FollowUpType: flw.FollowUpType || 'Call',
      Remarks: (flw.Remarks || '').trim(),
      Status: flw.Status || 'Planned',
      AssignedTo: flw.AssignedTo || userId
    };
    this.data.followUps.push(newFlw);
    this.save();
    return newFlw;
  }

  updateFollowUp(id, updates) {
    const idx = this.data.followUps.findIndex(f => f.FollowUpId === id);
    if (idx === -1) return null;
    this.data.followUps[idx] = { ...this.data.followUps[idx], ...updates };
    this.save();
    return this.data.followUps[idx];
  }

  deleteFollowUp(id) {
    const idx = this.data.followUps.findIndex(f => f.FollowUpId === id);
    if (idx === -1) return null;
    const removed = this.data.followUps.splice(idx, 1)[0];
    this.save();
    return removed;
  }

  // --- ACTIVITIES ---
  getActivities(user) {
    let list = this.data.activities;
    if (user && user.RoleName === 'SalesExecutive') {
      list = list.filter(a => a.AssignedTo === user.UserId);
    }
    return list;
  }

  createActivity(act, userId) {
    const newAct = {
      ActivityId: 'act-' + Date.now(),
      ActivityType: act.ActivityType || 'Call',
      Subject: act.Subject.trim(),
      Description: (act.Description || '').trim(),
      ActivityDate: act.ActivityDate || new Date().toISOString(),
      CustomerId: act.CustomerId || null,
      LeadId: act.LeadId || null,
      AssignedTo: act.AssignedTo || userId,
      Status: act.Status || 'Completed'
    };
    this.data.activities.push(newAct);
    this.save();
    return newAct;
  }

  // --- AUDIT LOGS (Append-only) ---
  getAuditLogs(filters = {}) {
    let list = [...this.data.auditLogs];
    if (filters.userId) {
      list = list.filter(l => l.UserId === filters.userId);
    }
    if (filters.module) {
      list = list.filter(l => l.EntityName && l.EntityName.toLowerCase() === filters.module.toLowerCase());
    }
    if (filters.action) {
      list = list.filter(l => l.Action && l.Action.toLowerCase() === filters.action.toLowerCase());
    }
    if (filters.startDate) {
      list = list.filter(l => new Date(l.CreatedDate) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      list = list.filter(l => new Date(l.CreatedDate) <= new Date(filters.endDate + 'T23:59:59.999Z'));
    }
    // Return newest first
    return list.sort((a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate));
  }

  logAudit({ userId, action, entityName, recordId, oldValue, newValue, ipAddress }) {
    const auditRecord = {
      AuditLogId: 'audit-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      UserId: userId || 'anonymous',
      Action: action,
      EntityName: entityName,
      RecordId: recordId ? String(recordId) : null,
      OldValue: oldValue ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : null,
      NewValue: newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null,
      CreatedDate: new Date().toISOString(),
      IpAddress: ipAddress || '127.0.0.1'
    };
    this.data.auditLogs.unshift(auditRecord);
    this.save();
    return auditRecord;
  }
}

// Singleton database instance
const db = new Database();
module.exports = db;
