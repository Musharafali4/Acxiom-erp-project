const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const leadController = require('../controllers/leadController');
const opportunityController = require('../controllers/opportunityController');
const followUpController = require('../controllers/followUpController');
const activityController = require('../controllers/activityController');
const userController = require('../controllers/userController');
const auditController = require('../controllers/auditController');
const reportController = require('../controllers/reportController');

const { authenticate, authorize } = require('../middleware/auth');
const {
  validateCustomer,
  validateLead,
  validateOpportunity,
  validateFollowUp
} = require('../middleware/validation');

// --- AUTHENTICATION ---
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/logout', authenticate, authController.logout);
router.get('/auth/me', authenticate, authController.me);

// --- CUSTOMERS ---
router.get('/customers', authenticate, customerController.getCustomers);
router.post('/customers', authenticate, validateCustomer, customerController.createCustomer);
router.get('/customers/:id', authenticate, customerController.getCustomerById);
router.put('/customers/:id', authenticate, validateCustomer, customerController.updateCustomer);
router.delete('/customers/:id', authenticate, customerController.deleteCustomer);

// --- LEADS ---
router.get('/leads', authenticate, leadController.getLeads);
router.post('/leads', authenticate, validateLead, leadController.createLead);
router.get('/leads/:id', authenticate, leadController.getLeadById);
router.put('/leads/:id', authenticate, validateLead, leadController.updateLead);
router.delete('/leads/:id', authenticate, leadController.deleteLead);
router.post('/leads/:id/convert', authenticate, leadController.convertLead);

// --- OPPORTUNITIES ---
router.get('/opportunities', authenticate, opportunityController.getOpportunities);
router.post('/opportunities', authenticate, validateOpportunity, opportunityController.createOpportunity);
router.get('/opportunities/:id', authenticate, opportunityController.getOpportunityById);
router.put('/opportunities/:id', authenticate, validateOpportunity, opportunityController.updateOpportunity);
router.delete('/opportunities/:id', authenticate, opportunityController.deleteOpportunity);

// --- FOLLOW-UPS ---
router.get('/followups', authenticate, followUpController.getFollowUps);
router.post('/followups', authenticate, validateFollowUp, followUpController.createFollowUp);
router.get('/followups/:id', authenticate, followUpController.getFollowUpById);
router.put('/followups/:id', authenticate, validateFollowUp, followUpController.updateFollowUp);
router.delete('/followups/:id', authenticate, followUpController.deleteFollowUp);

// --- ACTIVITIES ---
router.get('/activities', authenticate, activityController.getActivities);
router.post('/activities', authenticate, activityController.createActivity);

// --- USER & ROLE MANAGEMENT (Admin Only) ---
router.get('/users', authenticate, authorize('Admin'), userController.getUsers);
router.post('/users', authenticate, authorize('Admin'), userController.createUser);
router.put('/users/:id', authenticate, authorize('Admin'), userController.updateUser);
router.post('/users/:id/lockout', authenticate, authorize('Admin'), userController.toggleLockout);
router.post('/users/:id/reset-password', authenticate, authorize('Admin'), userController.resetPassword);
router.get('/roles', authenticate, userController.getRoles);

// --- AUDIT LOGS (Admin and Manager) ---
router.get('/audit-logs', authenticate, auditController.getAuditLogs);

// --- REPORTS & DASHBOARD ---
router.get('/reports/dashboard', authenticate, reportController.getDashboard);
router.get('/reports/pipeline', authenticate, reportController.getPipelineReport);
router.get('/reports/conversion', authenticate, reportController.getConversionReport);
router.get('/reports/user-activity', authenticate, reportController.getUserActivityReport);

// --- DEMO RESET HELPER ---
router.post('/system/reset-demo', authenticate, authorize('Admin'), (req, res) => {
  const db = require('../database/db');
  db.seed();
  res.status(200).json({ success: true, message: 'Database reset to initial demo state.' });
});

module.exports = router;
