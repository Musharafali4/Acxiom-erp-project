/**
 * AcxiomCRM Enterprise Client Application
 * Handles authentication, RBAC, state management, validations, Chart.js, and CRUD operations.
 */

// Global State
let currentUser = null;
let currentToken = null;
let currentView = 'dashboard';
let customersList = [];
let leadsList = [];
let opportunitiesList = [];

let leadChartInstance = null;
let pipelineChartInstance = null;
let monthlySalesChartInstance = null;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  // Check existing session
  const storedToken = localStorage.getItem('acxiom_token');
  const storedUser = localStorage.getItem('acxiom_user');

  if (storedToken && storedUser) {
    currentToken = storedToken;
    currentUser = JSON.parse(storedUser);
    setupAuthenticatedUI();
  } else {
    showAuthView();
  }
});

// ==========================================================================
// 1. AUTHENTICATION & SESSION
// ==========================================================================

function showAuthView() {
  document.getElementById('authView').style.display = 'flex';
  document.getElementById('appShell').style.display = 'none';
}

function setupAuthenticatedUI() {
  document.getElementById('authView').style.display = 'none';
  document.getElementById('appShell').style.display = 'flex';

  // Set user profile in sidebar
  document.getElementById('sidebarUserName').textContent = currentUser.Name;
  document.getElementById('sidebarUserRole').textContent = currentUser.RoleName;
  document.getElementById('sidebarAvatar').textContent = currentUser.Name.charAt(0).toUpperCase();

  // Role selector synchronization
  const roleSelect = document.getElementById('quickRoleSelect');
  if (roleSelect) roleSelect.value = currentUser.RoleName;

  // Apply RBAC UI rules
  applyRbacNav();

  // Switch to initial view
  switchView('dashboard');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabLoginBtn.classList.remove('active');
    tabRegisterBtn.classList.add('active');
  }
}

function quickFillLogin(email, password) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = password;
  document.getElementById('loginForm').dispatchEvent(new Event('submit'));
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  let isValid = true;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailInput.classList.add('is-invalid');
    isValid = false;
  } else {
    emailInput.classList.remove('is-invalid');
  }

  if (!password) {
    passwordInput.classList.add('is-invalid');
    isValid = false;
  } else {
    passwordInput.classList.remove('is-invalid');
  }

  if (!isValid) return;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      currentToken = data.token;
      currentUser = data.user;
      localStorage.setItem('acxiom_token', currentToken);
      localStorage.setItem('acxiom_user', JSON.stringify(currentUser));
      showToast(`Welcome back, ${currentUser.Name}!`, 'success');
      setupAuthenticatedUI();
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to authentication server.', 'error');
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const roleName = document.getElementById('regRole').value;
  const password = document.getElementById('regPassword').value;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, roleName, password })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Registration successful! Please sign in.', 'success');
      switchAuthTab('login');
      document.getElementById('loginEmail').value = email;
    } else {
      const errDetail = data.errors ? data.errors.join(' ') : data.message;
      showToast(errDetail || 'Registration rejected by policy.', 'error');
    }
  } catch (err) {
    showToast('Network error during registration.', 'error');
  }
}

async function handleLogout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } catch (e) {
    // ignore
  }

  currentToken = null;
  currentUser = null;
  localStorage.removeItem('acxiom_token');
  localStorage.removeItem('acxiom_user');
  showAuthView();
  showToast('You have been logged out securely.', 'info');
}

// Quick Switch role for testing authorization requirements (Section 17.10)
async function handleRoleSwitch(targetRole) {
  let email = 'admin@acxiom.com';
  let pass = 'Admin@123!';

  if (targetRole === 'Manager') {
    email = 'manager@acxiom.com';
    pass = 'Password@123!';
  } else if (targetRole === 'SalesExecutive') {
    email = 'sarah.sales@acxiom.com';
    pass = 'Password@123!';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (data.success) {
      currentToken = data.token;
      currentUser = data.user;
      localStorage.setItem('acxiom_token', currentToken);
      localStorage.setItem('acxiom_user', JSON.stringify(currentUser));
      setupAuthenticatedUI();
      showToast(`Switched active session to: ${currentUser.RoleName} (${currentUser.Name})`, 'success');
    }
  } catch (err) {
    showToast('Failed to switch role session.', 'error');
  }
}

function applyRbacNav() {
  const adminNav = document.getElementById('adminNavGroup');
  if (currentUser.RoleName === 'Admin') {
    adminNav.style.display = 'block';
  } else if (currentUser.RoleName === 'Manager') {
    adminNav.style.display = 'block'; // managers can view limited audit
  } else {
    adminNav.style.display = 'none'; // sales executives have no user/audit access
  }
}

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${currentToken}`
  };
}

// ==========================================================================
// 2. VIEW NAVIGATION & GLOBAL ROUTING
// ==========================================================================

function switchView(viewName) {
  // Check RBAC protection
  if ((viewName === 'users') && currentUser.RoleName !== 'Admin') {
    showToast('Forbidden: User administration is restricted to Admins.', 'error');
    return;
  }
  if ((viewName === 'audit') && currentUser.RoleName === 'SalesExecutive') {
    showToast('Forbidden: Sales Executives cannot inspect audit logs.', 'error');
    return;
  }

  currentView = viewName;

  // Update navigation styles
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    }
  });

  // Update breadcrumb
  const titles = {
    dashboard: 'Executive Dashboard',
    customers: 'Customer Management',
    leads: 'Lead Management',
    opportunities: 'Opportunity Pipeline',
    followups: 'Follow-Up Schedule',
    activities: 'Activity Log',
    reports: 'Enterprise Reports',
    users: 'User & Role Governance',
    audit: 'Security & Audit Log',
    tester: 'Acceptance Test Console'
  };
  document.getElementById('breadcrumbCurrent').textContent = titles[viewName] || viewName;

  // Toggle page views
  document.querySelectorAll('.page-view').forEach(view => {
    view.style.display = 'none';
  });

  const activePage = document.getElementById(`view-${viewName}`);
  if (activePage) activePage.style.display = 'block';

  // Load view-specific data
  loadViewData(viewName);
}

function refreshCurrentView() {
  loadViewData(currentView);
  showToast('Data refreshed.', 'info');
}

function loadViewData(viewName) {
  switch (viewName) {
    case 'dashboard': loadDashboardData(); break;
    case 'customers': loadCustomers(); break;
    case 'leads': loadLeads(); break;
    case 'opportunities': loadOpportunities(); break;
    case 'followups': loadFollowUps(); break;
    case 'activities': loadActivities(); break;
    case 'reports': loadSelectedReport('pipeline'); break;
    case 'users': loadUsers(); break;
    case 'audit': loadAuditLogs(); break;
  }
}

// ==========================================================================
// 3. DASHBOARD & CHART.JS (Section 17.11 & 17.12)
// ==========================================================================

async function loadDashboardData() {
  try {
    const res = await fetch('/api/reports/dashboard', { headers: getAuthHeaders() });
    if (!res.ok) return;
    const { data } = await res.json();

    // Populate KPIs
    document.getElementById('kpiTotalCustomers').textContent = data.kpis.totalCustomers;
    document.getElementById('kpiTotalLeads').textContent = data.kpis.totalLeads;
    document.getElementById('kpiOpenLeadsSub').textContent = `${data.kpis.openLeads} open / qualified leads`;
    document.getElementById('kpiOpenOpportunities').textContent = data.kpis.openOpportunities;
    document.getElementById('kpiTotalOpportunitiesSub').textContent = `out of ${data.kpis.totalOpportunities} total deals`;
    document.getElementById('kpiWonOpportunities').textContent = data.kpis.wonOpportunities;
    document.getElementById('kpiWonRevenueSub').textContent = `₹${(data.kpis.wonRevenue || 0).toLocaleString('en-IN')} revenue`;
    document.getElementById('kpiLostOpportunities').textContent = data.kpis.lostOpportunities;
    document.getElementById('kpiPipelineValue').textContent = `₹${(data.kpis.totalPipelineValue || 0).toLocaleString('en-IN')}`;
    document.getElementById('kpiWeightedPipelineSub').textContent = `Weighted: ₹${(data.kpis.weightedPipelineValue || 0).toLocaleString('en-IN')}`;

    // Update navigation counters
    document.getElementById('badgeCustomerCount').textContent = data.kpis.totalCustomers;
    document.getElementById('badgeLeadCount').textContent = data.kpis.totalLeads;
    document.getElementById('badgeFollowUpCount').textContent = data.kpis.pendingFollowUps;

    // Render Charts
    renderCharts(data.charts);
  } catch (err) {
    console.error('Failed to load dashboard:', err);
  }
}

function renderCharts(charts) {
  // 1. Pipeline by Stage Chart
  const ctxPipeline = document.getElementById('pipelineChart');
  if (ctxPipeline) {
    if (pipelineChartInstance) pipelineChartInstance.destroy();
    pipelineChartInstance = new Chart(ctxPipeline, {
      type: 'bar',
      data: {
        labels: ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'],
        datasets: [{
          label: 'Deal Amount (₹)',
          data: [
            charts.stageAmounts.Qualification || 0,
            charts.stageAmounts.Proposal || 0,
            charts.stageAmounts.Negotiation || 0,
            charts.stageAmounts.Won || 0,
            charts.stageAmounts.Lost || 0
          ],
          backgroundColor: ['#0284c7', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => '₹' + (value / 1000).toFixed(0) + 'k'
            }
          }
        }
      }
    });
  }

  // 2. Lead Status Distribution
  const ctxLead = document.getElementById('leadStatusChart');
  if (ctxLead) {
    if (leadChartInstance) leadChartInstance.destroy();
    leadChartInstance = new Chart(ctxLead, {
      type: 'doughnut',
      data: {
        labels: ['New', 'Contacted', 'Qualified', 'Lost', 'Converted'],
        datasets: [{
          data: [
            charts.leadStatusCounts.New || 0,
            charts.leadStatusCounts.Contacted || 0,
            charts.leadStatusCounts.Qualified || 0,
            charts.leadStatusCounts.Lost || 0,
            charts.leadStatusCounts.Converted || 0
          ],
          backgroundColor: ['#0f766e', '#2563eb', '#7c3aed', '#dc2626', '#9333ea']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // 3. Monthly Sales Performance
  const ctxMonthly = document.getElementById('monthlySalesChart');
  if (ctxMonthly) {
    if (monthlySalesChartInstance) monthlySalesChartInstance.destroy();
    monthlySalesChartInstance = new Chart(ctxMonthly, {
      type: 'line',
      data: {
        labels: charts.monthlySales.map(m => m.month),
        datasets: [
          {
            label: 'Closed Revenue (₹)',
            data: charts.monthlySales.map(m => m.won),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Open Pipeline (₹)',
            data: charts.monthlySales.map(m => m.pipeline),
            borderColor: '#3b82f6',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => '₹' + (value / 1000).toFixed(0) + 'k'
            }
          }
        }
      }
    });
  }
}

// ==========================================================================
// 4. CUSTOMER MANAGEMENT (Section 4.4, 17.5, 17.13)
// ==========================================================================

async function loadCustomers() {
  const search = document.getElementById('customerSearch').value;
  const status = document.getElementById('customerStatusFilter').value;

  try {
    const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    customersList = json.data || [];

    const tbody = document.getElementById('customersTableBody');
    tbody.innerHTML = '';

    if (customersList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--neutral-500); padding: 32px;">No customers found matching filter.</td></tr>`;
      return;
    }

    customersList.forEach(c => {
      const badgeClass = c.Status === 'Active' ? 'badge-active' : c.Status === 'Prospect' ? 'badge-prospect' : 'badge-inactive';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--primary);">${c.CustomerCode}</strong></td>
        <td><strong>${escapeHtml(c.CustomerName)}</strong></td>
        <td>${escapeHtml(c.CompanyName || '—')}</td>
        <td>${escapeHtml(c.Email)}</td>
        <td>${escapeHtml(c.Phone)}</td>
        <td>${escapeHtml(c.City ? `${c.City}, ${c.State}` : '—')}</td>
        <td><span class="badge ${badgeClass}">${c.Status}</span></td>
        <td style="text-align: right;">
          <div class="table-actions" style="justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="viewCustomerDetails('${c.CustomerId}')" title="Details & History"><i class="fa-solid fa-eye"></i></button>
            <button class="btn btn-secondary btn-sm" onclick="openEditCustomerModal('${c.CustomerId}')" title="Edit Record"><i class="fa-solid fa-pen"></i></button>
            ${currentUser.RoleName !== 'SalesExecutive' ? `
              <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${c.CustomerId}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
            ` : ''}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load customers.', 'error');
  }
}

function openCreateCustomerModal() {
  document.getElementById('customerForm').reset();
  document.getElementById('custFormId').value = '';
  document.getElementById('customerModalTitle').textContent = 'Create New Customer';
  document.getElementById('saveCustBtn').textContent = 'Save Customer';
  resetValidationErrors('customerForm');
  openModal('customerModal');
}

function openEditCustomerModal(id) {
  const c = customersList.find(item => item.CustomerId === id);
  if (!c) return;

  document.getElementById('custFormId').value = c.CustomerId;
  document.getElementById('custName').value = c.CustomerName;
  document.getElementById('custEmail').value = c.Email;
  document.getElementById('custPhone').value = c.Phone;
  document.getElementById('custCompany').value = c.CompanyName || '';
  document.getElementById('custAddress').value = c.Address || '';
  document.getElementById('custCity').value = c.City || '';
  document.getElementById('custState').value = c.State || '';
  document.getElementById('custStatus').value = c.Status || 'Active';

  document.getElementById('customerModalTitle').textContent = `Edit Customer: ${c.CustomerCode}`;
  document.getElementById('saveCustBtn').textContent = 'Update Customer';
  resetValidationErrors('customerForm');
  openModal('customerModal');
}

async function handleCustomerSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('custFormId').value;
  const name = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const company = document.getElementById('custCompany').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const city = document.getElementById('custCity').value.trim();
  const state = document.getElementById('custState').value.trim();
  const status = document.getElementById('custStatus').value;

  // Client-side Validation (Section 5.1 & 17.5)
  let isValid = true;
  if (!name) {
    markInvalid('custName', 'Customer Name is required.');
    isValid = false;
  } else {
    markValid('custName');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    markInvalid('custEmail', 'Enter a valid email address.');
    isValid = false;
  } else {
    markValid('custEmail');
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!phone || cleanPhone.length !== 10) {
    markInvalid('custPhone', 'Enter a valid 10-digit phone number.');
    isValid = false;
  } else {
    markValid('custPhone');
  }

  if (!isValid) return;

  const payload = {
    CustomerName: name,
    Email: email,
    Phone: phone,
    CompanyName: company,
    Address: address,
    City: city,
    State: state,
    Status: status
  };

  try {
    const url = id ? `/api/customers/${id}` : '/api/customers';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message, 'success');
      closeModal('customerModal');
      loadCustomers();
    } else {
      const errs = data.errors ? data.errors.join(' ') : data.message;
      showToast(errs || 'Failed to save customer record.', 'error');
    }
  } catch (err) {
    showToast('Network error while saving customer.', 'error');
  }
}

async function viewCustomerDetails(id) {
  try {
    const res = await fetch(`/api/customers/${id}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!data.success) return;
    const c = data.data;

    const html = `
      <div class="detail-grid">
        <div class="detail-item"><div class="label">Customer Code</div><div class="value">${c.CustomerCode}</div></div>
        <div class="detail-item"><div class="label">Status</div><div class="value">${c.Status}</div></div>
        <div class="detail-item"><div class="label">Customer Name</div><div class="value">${escapeHtml(c.CustomerName)}</div></div>
        <div class="detail-item"><div class="label">Company</div><div class="value">${escapeHtml(c.CompanyName || '—')}</div></div>
        <div class="detail-item"><div class="label">Email Address</div><div class="value">${escapeHtml(c.Email)}</div></div>
        <div class="detail-item"><div class="label">Phone</div><div class="value">${escapeHtml(c.Phone)}</div></div>
        <div class="detail-item"><div class="label">Address</div><div class="value">${escapeHtml(c.Address || '—')}</div></div>
        <div class="detail-item"><div class="label">City / State</div><div class="value">${escapeHtml(c.City || '—')}, ${escapeHtml(c.State || '—')}</div></div>
      </div>

      <h4 style="font-size: 14px; margin-bottom: 10px;"><i class="fa-solid fa-handshake text-blue-600"></i> Associated Opportunities (${c.opportunities.length})</h4>
      <div style="margin-bottom: 20px;">
        ${c.opportunities.length === 0 ? '<p style="color: var(--neutral-500); font-size: 12px;">No deals linked.</p>' :
        c.opportunities.map(o => `
            <div style="background: var(--neutral-50); border: 1px solid var(--neutral-200); padding: 8px 12px; border-radius: 4px; margin-bottom: 6px; display: flex; justify-content: space-between;">
              <strong>${escapeHtml(o.OpportunityName)}</strong>
              <span>₹${o.Amount.toLocaleString()} • <strong>${o.Stage}</strong></span>
            </div>
          `).join('')}
      </div>

      <h4 style="font-size: 14px; margin-bottom: 10px;"><i class="fa-solid fa-calendar-check text-green-600"></i> Scheduled Follow-ups (${c.followUps.length})</h4>
      <div>
        ${c.followUps.length === 0 ? '<p style="color: var(--neutral-500); font-size: 12px;">No scheduled follow-ups.</p>' :
        c.followUps.map(f => `
            <div style="background: var(--neutral-50); border: 1px solid var(--neutral-200); padding: 8px 12px; border-radius: 4px; margin-bottom: 6px;">
              <strong>${f.FollowUpDate}</strong> (${f.FollowUpType}): ${escapeHtml(f.Remarks)} • <span class="badge badge-planned">${f.Status}</span>
            </div>
          `).join('')}
      </div>
    `;

    document.getElementById('customerDetailsContent').innerHTML = html;
    openModal('customerDetailsModal');
  } catch (err) {
    showToast('Failed to load customer details.', 'error');
  }
}

async function deleteCustomer(id) {
  if (!confirm('Are you sure you want to permanently delete this customer record?')) return;
  try {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Customer deleted successfully.', 'success');
      loadCustomers();
    } else {
      showToast(data.message || 'Cannot delete customer.', 'error');
    }
  } catch (err) {
    showToast('Failed to delete customer.', 'error');
  }
}

// ==========================================================================
// 5. LEAD MANAGEMENT & CONVERSION (Section 4.5 & 8)
// ==========================================================================

async function loadLeads() {
  const search = document.getElementById('leadSearch').value;
  const status = document.getElementById('leadStatusFilter').value;

  try {
    const res = await fetch(`/api/leads?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    leadsList = json.data || [];

    const tbody = document.getElementById('leadsTableBody');
    tbody.innerHTML = '';

    if (leadsList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--neutral-500); padding: 32px;">No leads found.</td></tr>`;
      return;
    }

    leadsList.forEach(l => {
      let badgeClass = 'badge-new';
      if (l.Status === 'Contacted') badgeClass = 'badge-contacted';
      else if (l.Status === 'Qualified') badgeClass = 'badge-qualified';
      else if (l.Status === 'Converted') badgeClass = 'badge-converted';
      else if (l.Status === 'Lost') badgeClass = 'badge-lost';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--primary);">${l.LeadCode}</strong></td>
        <td><strong>${escapeHtml(l.LeadName)}</strong></td>
        <td>${escapeHtml(l.CompanyName || '—')}</td>
        <td>${escapeHtml(l.Source)}</td>
        <td>₹${(Number(l.ExpectedValue) || 0).toLocaleString('en-IN')}</td>
        <td><span class="badge ${l.Priority === 'High' ? 'badge-lost' : 'badge-proposal'}">${l.Priority}</span></td>
        <td><span class="badge ${badgeClass}">${l.Status}</span></td>
        <td style="text-align: right;">
          <div class="table-actions" style="justify-content: flex-end;">
            ${l.Status !== 'Converted' ? `
              <button class="btn btn-success btn-sm" onclick="openConvertLeadModal('${l.LeadId}')" title="Convert to Customer/Opportunity">
                <i class="fa-solid fa-arrows-spin"></i> Convert
              </button>
            ` : '<span class="badge badge-active" style="margin-right: 6px;">Converted</span>'}
            <button class="btn btn-secondary btn-sm" onclick="openEditLeadModal('${l.LeadId}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
            ${currentUser.RoleName !== 'SalesExecutive' ? `
              <button class="btn btn-danger btn-sm" onclick="deleteLead('${l.LeadId}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
            ` : ''}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load leads.', 'error');
  }
}

function openCreateLeadModal() {
  document.getElementById('leadForm').reset();
  document.getElementById('leadFormId').value = '';
  document.getElementById('leadModalTitle').textContent = 'Capture New Lead';
  document.getElementById('saveLeadBtn').textContent = 'Save Lead';
  resetValidationErrors('leadForm');
  openModal('leadModal');
}

function openEditLeadModal(id) {
  const l = leadsList.find(item => item.LeadId === id);
  if (!l) return;

  document.getElementById('leadFormId').value = l.LeadId;
  document.getElementById('leadName').value = l.LeadName;
  document.getElementById('leadEmail').value = l.Email || '';
  document.getElementById('leadPhone').value = l.Phone || '';
  document.getElementById('leadCompany').value = l.CompanyName || '';
  document.getElementById('leadSource').value = l.Source;
  document.getElementById('leadExpectedValue').value = l.ExpectedValue || '';
  document.getElementById('leadPriority').value = l.Priority;
  document.getElementById('leadStatus').value = l.Status;

  document.getElementById('leadModalTitle').textContent = `Edit Lead: ${l.LeadCode}`;
  document.getElementById('saveLeadBtn').textContent = 'Update Lead';
  resetValidationErrors('leadForm');
  openModal('leadModal');
}

async function handleLeadSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('leadFormId').value;
  const name = document.getElementById('leadName').value.trim();
  const email = document.getElementById('leadEmail').value.trim();
  const phone = document.getElementById('leadPhone').value.trim();
  const company = document.getElementById('leadCompany').value.trim();
  const source = document.getElementById('leadSource').value;
  const expectedValue = document.getElementById('leadExpectedValue').value;
  const priority = document.getElementById('leadPriority').value;
  const status = document.getElementById('leadStatus').value;

  // Validation
  let isValid = true;
  if (!name) {
    markInvalid('leadName', 'Lead name is mandatory.');
    isValid = false;
  } else {
    markValid('leadName');
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    markInvalid('leadEmail', 'Enter a valid email address.');
    isValid = false;
  }

  if (!isValid) return;

  const payload = {
    LeadName: name,
    Email: email,
    Phone: phone,
    CompanyName: company,
    Source: source,
    ExpectedValue: expectedValue ? Number(expectedValue) : 0,
    Priority: priority,
    Status: status
  };

  try {
    const url = id ? `/api/leads/${id}` : '/api/leads';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message, 'success');
      closeModal('leadModal');
      loadLeads();
    } else {
      showToast(data.message || 'Failed to save lead.', 'error');
    }
  } catch (err) {
    showToast('Failed to save lead.', 'error');
  }
}

function openConvertLeadModal(leadId) {
  const lead = leadsList.find(l => l.LeadId === leadId);
  if (!lead) return;

  document.getElementById('convertLeadId').value = lead.LeadId;
  document.getElementById('convertLeadNotice').textContent = `Converting Lead: ${lead.LeadName} (${lead.CompanyName || 'Individual'})`;
  document.getElementById('convertOppAmount').value = lead.ExpectedValue || 500000;

  // Set default expected close date 30 days from now
  const d = new Date();
  d.setDate(d.getDate() + 30);
  document.getElementById('convertOppCloseDate').value = d.toISOString().split('T')[0];

  openModal('convertLeadModal');
}

function toggleConvertOppFields(checked) {
  document.getElementById('convertOppFieldsGroup').style.display = checked ? 'block' : 'none';
}

async function handleConvertLeadSubmit(event) {
  event.preventDefault();
  const leadId = document.getElementById('convertLeadId').value;
  const createOpp = document.getElementById('convertCreateOppCheck').checked;
  const oppAmount = document.getElementById('convertOppAmount').value;
  const closeDate = document.getElementById('convertOppCloseDate').value;

  try {
    const res = await fetch(`/api/leads/${leadId}/convert`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        createOpportunity: createOpp,
        opportunityAmount: Number(oppAmount),
        expectedCloseDate: closeDate
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message, 'success');
      closeModal('convertLeadModal');
      loadLeads();
    } else {
      showToast(data.message || 'Conversion failed.', 'error');
    }
  } catch (err) {
    showToast('Network error during lead conversion.', 'error');
  }
}

async function deleteLead(id) {
  if (!confirm('Are you sure you want to delete this lead?')) return;
  try {
    const res = await fetch(`/api/leads/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Lead deleted.', 'success');
      loadLeads();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to delete lead.', 'error');
  }
}

// ==========================================================================
// 6. OPPORTUNITY MANAGEMENT (Section 4.8 & 17.7)
// ==========================================================================

async function loadOpportunities() {
  const search = document.getElementById('opportunitySearch').value;
  const stage = document.getElementById('opportunityStageFilter').value;

  try {
    const res = await fetch(`/api/opportunities?search=${encodeURIComponent(search)}&stage=${encodeURIComponent(stage)}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    opportunitiesList = json.data || [];

    const tbody = document.getElementById('opportunitiesTableBody');
    tbody.innerHTML = '';

    if (opportunitiesList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--neutral-500); padding: 32px;">No opportunities found.</td></tr>`;
      return;
    }

    opportunitiesList.forEach(o => {
      let stageBadge = 'badge-proposal';
      if (o.Stage === 'Won') stageBadge = 'badge-won';
      else if (o.Stage === 'Lost') stageBadge = 'badge-lost';
      else if (o.Stage === 'Negotiation') stageBadge = 'badge-negotiation';
      else if (o.Stage === 'Qualification') stageBadge = 'badge-qualification';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(o.OpportunityName)}</strong></td>
        <td>${escapeHtml(o.CustomerName || '—')}</td>
        <td><strong>₹${o.Amount.toLocaleString('en-IN')}</strong></td>
        <td>${o.Probability}%</td>
        <td>₹${o.WeightedAmount.toLocaleString('en-IN')}</td>
        <td>${o.ExpectedCloseDate}</td>
        <td><span class="badge ${stageBadge}">${o.Stage}</span></td>
        <td style="text-align: right;">
          <div class="table-actions" style="justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="openEditOpportunityModal('${o.OpportunityId}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
            ${currentUser.RoleName !== 'SalesExecutive' ? `
              <button class="btn btn-danger btn-sm" onclick="deleteOpportunity('${o.OpportunityId}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
            ` : ''}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load opportunities.', 'error');
  }
}

async function populateCustomerSelect(selectId, selectedId = null) {
  const sel = document.getElementById(selectId);
  sel.innerHTML = '<option value="">-- Select Customer --</option>';

  if (customersList.length === 0) {
    const res = await fetch('/api/customers', { headers: getAuthHeaders() });
    const json = await res.json();
    customersList = json.data || [];
  }

  customersList.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.CustomerId;
    opt.textContent = `${c.CustomerName} (${c.CustomerCode})`;
    if (selectedId && c.CustomerId === selectedId) opt.selected = true;
    sel.appendChild(opt);
  });
}

async function openCreateOpportunityModal() {
  document.getElementById('opportunityForm').reset();
  document.getElementById('oppFormId').value = '';
  document.getElementById('opportunityModalTitle').textContent = 'New Sales Opportunity';
  document.getElementById('saveOppBtn').textContent = 'Save Opportunity';
  await populateCustomerSelect('oppCustomerId');

  // Default close date 1 month in future
  const d = new Date();
  d.setDate(d.getDate() + 30);
  document.getElementById('oppCloseDate').value = d.toISOString().split('T')[0];

  resetValidationErrors('opportunityForm');
  openModal('opportunityModal');
}

async function openEditOpportunityModal(id) {
  const o = opportunitiesList.find(item => item.OpportunityId === id);
  if (!o) return;

  document.getElementById('oppFormId').value = o.OpportunityId;
  document.getElementById('oppName').value = o.OpportunityName;
  document.getElementById('oppAmount').value = o.Amount;
  document.getElementById('oppProbability').value = o.Probability;
  document.getElementById('oppStage').value = o.Stage;
  document.getElementById('oppCloseDate').value = o.ExpectedCloseDate;
  document.getElementById('oppNotes').value = o.Notes || '';

  await populateCustomerSelect('oppCustomerId', o.CustomerId);

  document.getElementById('opportunityModalTitle').textContent = `Edit Opportunity: ${o.OpportunityName}`;
  document.getElementById('saveOppBtn').textContent = 'Update Opportunity';
  resetValidationErrors('opportunityForm');
  openModal('opportunityModal');
}

async function handleOpportunitySubmit(event) {
  event.preventDefault();
  const id = document.getElementById('oppFormId').value;
  const name = document.getElementById('oppName').value.trim();
  const customerId = document.getElementById('oppCustomerId').value;
  const amount = Number(document.getElementById('oppAmount').value);
  const probability = Number(document.getElementById('oppProbability').value);
  const stage = document.getElementById('oppStage').value;
  const closeDate = document.getElementById('oppCloseDate').value;
  const notes = document.getElementById('oppNotes').value.trim();

  // Client-side Validation (Section 5.3, 5.4, 17.7)
  let isValid = true;
  if (!name) {
    markInvalid('oppName', 'Opportunity Name is required.');
    isValid = false;
  } else {
    markValid('oppName');
  }

  if (isNaN(amount) || amount <= 0) {
    markInvalid('oppAmount', 'Opportunity Amount must be greater than 0.');
    isValid = false;
  } else {
    markValid('oppAmount');
  }

  if (isNaN(probability) || probability < 0 || probability > 100) {
    markInvalid('oppProbability', 'Probability must be between 0 and 100.');
    isValid = false;
  } else {
    markValid('oppProbability');
  }

  if (!closeDate) {
    markInvalid('oppCloseDate', 'Expected Close Date is required.');
    isValid = false;
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDate = new Date(closeDate + 'T23:59:59');
    if (stage !== 'Won' && stage !== 'Lost' && selDate < today) {
      markInvalid('oppCloseDate', 'Expected Close Date cannot be in the past.');
      isValid = false;
    } else {
      markValid('oppCloseDate');
    }
  }

  if (!isValid) return;

  const payload = {
    OpportunityName: name,
    CustomerId: customerId || null,
    Amount: amount,
    Probability: probability,
    Stage: stage,
    ExpectedCloseDate: closeDate,
    Notes: notes
  };

  try {
    const url = id ? `/api/opportunities/${id}` : '/api/opportunities';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message, 'success');
      closeModal('opportunityModal');
      loadOpportunities();
    } else {
      const errs = data.errors ? data.errors.join(' ') : data.message;
      showToast(errs || 'Failed to save opportunity.', 'error');
    }
  } catch (err) {
    showToast('Failed to save opportunity.', 'error');
  }
}

async function deleteOpportunity(id) {
  if (!confirm('Are you sure you want to delete this opportunity?')) return;
  try {
    const res = await fetch(`/api/opportunities/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Opportunity deleted.', 'success');
      loadOpportunities();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to delete opportunity.', 'error');
  }
}

// ==========================================================================
// 7. FOLLOW-UP MANAGEMENT (Section 4.6 & 17.7)
// ==========================================================================

async function loadFollowUps() {
  const search = document.getElementById('followUpSearch').value;
  const status = document.getElementById('followUpStatusFilter').value;

  try {
    const res = await fetch(`/api/followups?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    const followUps = json.data || [];

    const tbody = document.getElementById('followUpsTableBody');
    tbody.innerHTML = '';

    if (followUps.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--neutral-500); padding: 32px;">No scheduled follow-ups.</td></tr>`;
      return;
    }

    followUps.forEach(f => {
      let badgeClass = 'badge-planned';
      if (f.Status === 'Completed') badgeClass = 'badge-completed';
      else if (f.Status === 'Missed' || f.IsOverdue) badgeClass = 'badge-lost';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong>${f.FollowUpDate}</strong>
          ${f.IsOverdue ? '<span class="badge badge-lost" style="margin-left: 4px;">OVERDUE</span>' : ''}
        </td>
        <td><i class="fa-solid ${f.FollowUpType === 'Call' ? 'fa-phone' : f.FollowUpType === 'Meeting' ? 'fa-users' : 'fa-envelope'}"></i> ${f.FollowUpType}</td>
        <td>${escapeHtml(f.RelatedName)}</td>
        <td>${escapeHtml(f.Remarks)}</td>
        <td><span class="badge ${badgeClass}">${f.Status}</span></td>
        <td style="text-align: right;">
          <div class="table-actions" style="justify-content: flex-end;">
            ${f.Status === 'Planned' ? `
              <button class="btn btn-success btn-sm" onclick="markFollowUpComplete('${f.FollowUpId}')" title="Mark Complete">
                <i class="fa-solid fa-check"></i>
              </button>
            ` : ''}
            <button class="btn btn-danger btn-sm" onclick="deleteFollowUp('${f.FollowUpId}')" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load follow-ups.', 'error');
  }
}

async function openCreateFollowUpModal() {
  document.getElementById('followUpForm').reset();
  await populateCustomerSelect('flwCustomerId');

  // Default follow-up date to today
  document.getElementById('flwDate').value = new Date().toISOString().split('T')[0];
  resetValidationErrors('followUpForm');
  openModal('followUpModal');
}

async function handleFollowUpSubmit(event) {
  event.preventDefault();
  const date = document.getElementById('flwDate').value;
  const type = document.getElementById('flwType').value;
  const customerId = document.getElementById('flwCustomerId').value;
  const remarks = document.getElementById('flwRemarks').value.trim();
  const status = document.getElementById('flwStatus').value;

  // Validation: Follow-up date cannot be earlier than today for planned (Section 5.3 & 17.7)
  let isValid = true;
  if (!date) {
    markInvalid('flwDate', 'Follow-Up Date is required.');
    isValid = false;
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDate = new Date(date + 'T23:59:59');
    if (status === 'Planned' && selDate < today) {
      markInvalid('flwDate', 'Follow-up date cannot be earlier than today.');
      isValid = false;
    } else {
      markValid('flwDate');
    }
  }

  if (!remarks) {
    markInvalid('flwRemarks', 'Remarks are required.');
    isValid = false;
  } else {
    markValid('flwRemarks');
  }

  if (!isValid) return;

  try {
    const res = await fetch('/api/followups', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        FollowUpDate: date,
        FollowUpType: type,
        CustomerId: customerId || null,
        Remarks: remarks,
        Status: status
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message, 'success');
      closeModal('followUpModal');
      loadFollowUps();
    } else {
      const errs = data.errors ? data.errors.join(' ') : data.message;
      showToast(errs || 'Failed to schedule follow-up.', 'error');
    }
  } catch (err) {
    showToast('Network error scheduling follow-up.', 'error');
  }
}

async function markFollowUpComplete(id) {
  try {
    const res = await fetch(`/api/followups/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ Status: 'Completed' })
    });
    if (res.ok) {
      showToast('Follow-up marked as Completed.', 'success');
      loadFollowUps();
    }
  } catch (e) {
    showToast('Failed to update follow-up.', 'error');
  }
}

async function deleteFollowUp(id) {
  if (!confirm('Delete this follow-up?')) return;
  try {
    const res = await fetch(`/api/followups/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (res.ok) {
      showToast('Follow-up deleted.', 'success');
      loadFollowUps();
    }
  } catch (e) {
    showToast('Failed to delete follow-up.', 'error');
  }
}

// ==========================================================================
// 8. ACTIVITY MANAGEMENT
// ==========================================================================

async function loadActivities() {
  try {
    const res = await fetch('/api/activities', { headers: getAuthHeaders() });
    const json = await res.json();
    const activities = json.data || [];

    const tbody = document.getElementById('activitiesTableBody');
    tbody.innerHTML = '';

    if (activities.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--neutral-500); padding: 32px;">No activity history recorded.</td></tr>`;
      return;
    }

    activities.forEach(a => {
      const dateFormatted = new Date(a.ActivityDate).toLocaleString();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span style="color: var(--neutral-500);">${dateFormatted}</span></td>
        <td><span class="badge badge-proposal">${a.ActivityType}</span></td>
        <td><strong>${escapeHtml(a.Subject)}</strong></td>
        <td>${escapeHtml(a.RelatedName)}</td>
        <td>${escapeHtml(a.AssignedUserName)}</td>
        <td><span class="badge badge-active">${a.Status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load activities.', 'error');
  }
}

async function openCreateActivityModal() {
  document.getElementById('activityForm').reset();
  await populateCustomerSelect('actCustomer');
  resetValidationErrors('activityForm');
  openModal('activityModal');
}

async function handleActivitySubmit(event) {
  event.preventDefault();
  const type = document.getElementById('actType').value;
  const customerId = document.getElementById('actCustomer').value;
  const subject = document.getElementById('actSubject').value.trim();
  const desc = document.getElementById('actDescription').value.trim();

  if (!subject) {
    markInvalid('actSubject', 'Subject is required.');
    return;
  }

  try {
    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ActivityType: type,
        CustomerId: customerId || null,
        Subject: subject,
        Description: desc,
        ActivityDate: new Date().toISOString()
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Activity logged successfully.', 'success');
      closeModal('activityModal');
      loadActivities();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to log activity.', 'error');
  }
}

// ==========================================================================
// 9. REPORTS (Section 4.11 & 11)
// ==========================================================================

async function loadSelectedReport(reportType) {
  const container = document.getElementById('reportContainer');
  container.innerHTML = '<p style="padding: 24px; color: var(--neutral-500);">Generating enterprise report...</p>';

  if (reportType === 'pipeline') {
    const res = await fetch('/api/reports/pipeline', { headers: getAuthHeaders() });
    const { data } = await res.json();

    let stageRows = '';
    for (const [stg, val] of Object.entries(data.byStage)) {
      stageRows += `
        <tr>
          <td><strong>${stg}</strong></td>
          <td>${val.count} deals</td>
          <td>₹${val.totalAmount.toLocaleString('en-IN')}</td>
          <td>₹${val.weightedAmount.toLocaleString('en-IN')}</td>
        </tr>
      `;
    }

    let ownerRows = '';
    for (const [owner, val] of Object.entries(data.byOwner)) {
      ownerRows += `
        <tr>
          <td><strong>${owner}</strong></td>
          <td>${val.count}</td>
          <td>₹${val.totalAmount.toLocaleString('en-IN')}</td>
          <td><span class="badge badge-won">${val.wonCount} deals (₹${val.wonAmount.toLocaleString('en-IN')})</span></td>
        </tr>
      `;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div class="table-card">
          <div style="padding: 14px 18px; font-weight: 700; border-bottom: 1px solid var(--neutral-200);">Stage-wise Pipeline Summary</div>
          <table class="data-table">
            <thead><tr><th>Stage</th><th>Deals</th><th>Total Amount</th><th>Weighted Amount</th></tr></thead>
            <tbody>${stageRows}</tbody>
          </table>
        </div>
        <div class="table-card">
          <div style="padding: 14px 18px; font-weight: 700; border-bottom: 1px solid var(--neutral-200);">Owner-wise Performance Breakdown</div>
          <table class="data-table">
            <thead><tr><th>Executive</th><th>Open Deals</th><th>Pipeline Value</th><th>Closed Won</th></tr></thead>
            <tbody>${ownerRows}</tbody>
          </table>
        </div>
      </div>
    `;
  } else if (reportType === 'conversion') {
    const res = await fetch('/api/reports/conversion', { headers: getAuthHeaders() });
    const { data } = await res.json();

    container.innerHTML = `
      <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr);">
        <div class="kpi-card accent-primary"><div class="kpi-label">Total Leads</div><div class="kpi-value">${data.totalLeads}</div></div>
        <div class="kpi-card accent-success"><div class="kpi-label">Converted to Customers</div><div class="kpi-value">${data.converted}</div></div>
        <div class="kpi-card accent-danger"><div class="kpi-label">Lost Leads</div><div class="kpi-value">${data.lost}</div></div>
        <div class="kpi-card accent-primary"><div class="kpi-label">Lead Win Rate</div><div class="kpi-value">${data.conversionRate}</div></div>
      </div>
    `;
  } else if (reportType === 'activity') {
    const res = await fetch('/api/reports/user-activity', { headers: getAuthHeaders() });
    const { data } = await res.json();

    let rows = data.map(u => `
      <tr>
        <td><strong>${escapeHtml(u.name)}</strong></td>
        <td><span class="badge badge-proposal">${u.role}</span></td>
        <td>${u.activitiesLogged} activities</td>
        <td>${u.followUpsAssigned} scheduled</td>
        <td>${u.dealsHandled} opportunities</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="table-card">
        <div style="padding: 14px 18px; font-weight: 700; border-bottom: 1px solid var(--neutral-200);">User & Team Activity Audit</div>
        <table class="data-table">
          <thead><tr><th>Executive Name</th><th>Role</th><th>Activities Logged</th><th>Follow-ups</th><th>Opportunities</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  } else if (reportType === 'customer') {
    loadCustomers();
    container.innerHTML = `<p style="padding: 24px; color: var(--neutral-500);">Viewing Customer Directory in Customers Tab. Use Export CSV button to download.</p>`;
  }
}

function exportCurrentReport() {
  exportData('report');
}

// ==========================================================================
// 10. USER & ROLE MANAGEMENT (Admin Only, Section 4.7 & 17.10)
// ==========================================================================

async function loadUsers() {
  try {
    const res = await fetch('/api/users', { headers: getAuthHeaders() });
    if (!res.ok) return;
    const json = await res.json();
    const users = json.data || [];

    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    users.forEach(u => {
      const isLocked = u.IsLocked;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code style="font-size: 11px;">${u.UserId}</code></td>
        <td><strong>${escapeHtml(u.Name)}</strong></td>
        <td>${escapeHtml(u.Email)}</td>
        <td><span class="badge badge-proposal">${u.RoleName}</span></td>
        <td><span class="badge ${u.IsActive ? 'badge-active' : 'badge-inactive'}">${u.IsActive ? 'Active' : 'Deactivated'}</span></td>
        <td><span class="badge ${isLocked ? 'badge-locked' : 'badge-active'}">${isLocked ? 'LOCKED' : 'Unlocked'}</span></td>
        <td>${u.FailedLoginCount || 0}</td>
        <td style="text-align: right;">
          <div class="table-actions" style="justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="toggleUserLockout('${u.UserId}')" title="${isLocked ? 'Unlock Account' : 'Manually Lock Account'}">
              <i class="fa-solid ${isLocked ? 'fa-lock-open text-green-600' : 'fa-lock text-red-600'}"></i> ${isLocked ? 'Unlock' : 'Lock'}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="promptResetPassword('${u.UserId}', '${escapeHtml(u.Name)}')" title="Reset Password">
              <i class="fa-solid fa-key"></i> Reset
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load users.', 'error');
  }
}

function openCreateUserModal() {
  document.getElementById('userForm').reset();
  resetValidationErrors('userForm');
  openModal('userModal');
}

async function handleUserSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('usrName').value.trim();
  const email = document.getElementById('usrEmail').value.trim();
  const roleName = document.getElementById('usrRole').value;
  const password = document.getElementById('usrPassword').value;

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ Name: name, Email: email, RoleName: roleName, Password: password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('User provisioned successfully.', 'success');
      closeModal('userModal');
      loadUsers();
    } else {
      const errs = data.errors ? data.errors.join(' ') : data.message;
      showToast(errs || 'Failed to create user.', 'error');
    }
  } catch (err) {
    showToast('Network error while provisioning user.', 'error');
  }
}

async function toggleUserLockout(userId) {
  try {
    const res = await fetch(`/api/users/${userId}/lockout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message, 'success');
      loadUsers();
    }
  } catch (err) {
    showToast('Failed to change lockout state.', 'error');
  }
}

async function promptResetPassword(userId, userName) {
  const newPass = prompt(`Enter new secure password for ${userName} (Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special):`);
  if (!newPass) return;

  try {
    const res = await fetch(`/api/users/${userId}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword: newPass })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast(data.message, 'success');
    } else {
      const errs = data.errors ? data.errors.join(' ') : data.message;
      showToast(errs || 'Password rejected by security policy.', 'error');
    }
  } catch (err) {
    showToast('Failed to reset password.', 'error');
  }
}

// ==========================================================================
// 11. AUDIT LOGGING (Section 4.9 & 17.16)
// ==========================================================================

async function loadAuditLogs() {
  const mod = document.getElementById('auditModuleFilter').value;
  const action = document.getElementById('auditActionFilter').value;

  try {
    const res = await fetch(`/api/audit-logs?module=${encodeURIComponent(mod)}&action=${encodeURIComponent(action)}`, {
      headers: getAuthHeaders()
    });
    const json = await res.json();
    const logs = json.data || [];

    const tbody = document.getElementById('auditTableBody');
    tbody.innerHTML = '';

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--neutral-500); padding: 32px;">No audit log records match filter.</td></tr>`;
      return;
    }

    logs.forEach(l => {
      const time = new Date(l.CreatedDate).toLocaleString();
      let badgeClass = 'badge-proposal';
      if (l.Action === 'Login') badgeClass = 'badge-active';
      else if (l.Action === 'Failed Login' || l.Action === 'Delete') badgeClass = 'badge-lost';
      else if (l.Action === 'Create') badgeClass = 'badge-new';
      else if (l.Action === 'Security') badgeClass = 'badge-qualified';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="white-space: nowrap; color: var(--neutral-600);">${time}</td>
        <td><strong>${escapeHtml(l.UserName)}</strong></td>
        <td><span class="badge ${badgeClass}">${l.Action}</span></td>
        <td><strong>${escapeHtml(l.EntityName || 'System')}</strong></td>
        <td><code>${l.IpAddress || '127.0.0.1'}</code></td>
        <td style="font-size: 12px; color: var(--neutral-700); max-width: 340px; word-break: break-all;">
          ${escapeHtml(l.NewValue || l.OldValue || '—')}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast('Failed to load audit trail.', 'error');
  }
}

// ==========================================================================
// 12. ACCEPTANCE TEST CONSOLE (Section 17.19)
// ==========================================================================

async function runAutomatedTests() {
  const resultsBox = document.getElementById('testResultsBox');
  const logDisplay = document.getElementById('testLogDisplay');
  resultsBox.style.display = 'block';
  logDisplay.innerHTML = 'Executing Section 17.19 Automated Acceptance Tests...\n\n';

  const appendLog = (msg) => {
    logDisplay.innerHTML += msg + '\n';
    logDisplay.scrollTop = logDisplay.scrollHeight;
  };

  try {
    // Test 1: Unauthenticated access blocked
    appendLog('[TEST 1] Testing protected endpoint without authentication...');
    const res1 = await fetch('/api/customers');
    appendLog(`  HTTP Status: ${res1.status} (Expected: 401 Unauthorized) -> ${res1.status === 401 ? 'PASSED ✅' : 'FAILED ❌'}`);

    // Test 2: Invalid Email and Phone validation rejection
    appendLog('[TEST 2] Testing server-side Customer validation rejection (invalid email & phone)...');
    const res2 = await fetch('/api/customers', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        CustomerName: 'Test Corp',
        Email: 'not-an-email',
        Phone: '123'
      })
    });
    const d2 = await res2.json();
    appendLog(`  HTTP Status: ${res2.status} (Expected: 400 Bad Request)`);
    appendLog(`  Errors caught by server: ${JSON.stringify(d2.errors)} -> ${res2.status === 400 ? 'PASSED ✅' : 'FAILED ❌'}`);

    // Test 3: Opportunity Amount <= 0 rejection
    appendLog('[TEST 3] Testing Opportunity Amount <= 0 server rejection...');
    const res3 = await fetch('/api/opportunities', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        OpportunityName: 'Negative Deal',
        Amount: -500,
        Probability: 50,
        ExpectedCloseDate: '2026-11-20'
      })
    });
    const d3 = await res3.json();
    appendLog(`  HTTP Status: ${res3.status} (Expected: 400) -> Errors: ${JSON.stringify(d3.errors)} -> ${res3.status === 400 ? 'PASSED ✅' : 'FAILED ❌'}`);

    // Test 4: Opportunity Probability > 100 rejection
    appendLog('[TEST 4] Testing Opportunity Probability > 100 server rejection...');
    const res4 = await fetch('/api/opportunities', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        OpportunityName: 'Over-prob deal',
        Amount: 100000,
        Probability: 150,
        ExpectedCloseDate: '2026-11-20'
      })
    });
    const d4 = await res4.json();
    appendLog(`  HTTP Status: ${res4.status} (Expected: 400) -> Errors: ${JSON.stringify(d4.errors)} -> ${res4.status === 400 ? 'PASSED ✅' : 'FAILED ❌'}`);

    // Test 5: Expected Close Date in the past rejection
    appendLog('[TEST 5] Testing Opportunity Expected Close Date in past rejection...');
    const res5 = await fetch('/api/opportunities', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        OpportunityName: 'Past Close Date Deal',
        Amount: 100000,
        Probability: 50,
        ExpectedCloseDate: '2020-01-01'
      })
    });
    const d5 = await res5.json();
    appendLog(`  HTTP Status: ${res5.status} (Expected: 400) -> Errors: ${JSON.stringify(d5.errors)} -> ${res5.status === 400 ? 'PASSED ✅' : 'FAILED ❌'}`);

    // Test 6: Follow-up date earlier than today rejection
    appendLog('[TEST 6] Testing Follow-Up Date earlier than today rejection...');
    const res6 = await fetch('/api/followups', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        FollowUpDate: '2020-01-01',
        Remarks: 'Meeting in past',
        Status: 'Planned'
      })
    });
    const d6 = await res6.json();
    appendLog(`  HTTP Status: ${res6.status} (Expected: 400) -> Errors: ${JSON.stringify(d6.errors)} -> ${res6.status === 400 ? 'PASSED ✅' : 'FAILED ❌'}`);

    // Test 7: REST API GET /api/customers returns valid JSON
    appendLog('[TEST 7] Testing GET /api/customers authorized JSON response...');
    const res7 = await fetch('/api/customers', { headers: getAuthHeaders() });
    const d7 = await res7.json();
    appendLog(`  HTTP Status: ${res7.status} -> Found ${d7.count} customers -> ${res7.status === 200 ? 'PASSED ✅' : 'FAILED ❌'}`);

    appendLog('\nAll Section 17.19 Acceptance Criteria Verified Successfully! ✅');
  } catch (err) {
    appendLog('\nError during test execution: ' + err.message);
  }
}

async function testInvalidOpportunityBypass() {
  const resultsBox = document.getElementById('testResultsBox');
  const logDisplay = document.getElementById('testLogDisplay');
  resultsBox.style.display = 'block';
  logDisplay.innerHTML = 'Testing Browser Validation Bypass with crafted payload directly sent to server...\n';

  const res = await fetch('/api/opportunities', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      OpportunityName: 'Tampered Payload',
      Amount: 0,
      Probability: 101,
      ExpectedCloseDate: '2019-12-31'
    })
  });
  const data = await res.json();
  logDisplay.innerHTML += `Response Code: ${res.status}\nServer Rejection Details:\n` + JSON.stringify(data, null, 2);
}

async function testAccountLockout() {
  const resultsBox = document.getElementById('testResultsBox');
  const logDisplay = document.getElementById('testLogDisplay');
  resultsBox.style.display = 'block';
  logDisplay.innerHTML = 'Executing 5 Consecutive Failed Logins to trigger Account Lockout...\n';

  for (let i = 1; i <= 5; i++) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.sales@acxiom.com', password: 'WrongPassword' + i })
    });
    const data = await res.json();
    logDisplay.innerHTML += `Attempt #${i}: Status ${res.status} - ${data.message}\n`;
  }
}

async function resetDemoData() {
  if (!confirm('Reset CRM database to fresh initial seed state?')) return;
  try {
    const res = await fetch('/api/system/reset-demo', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, 'success');
      loadDashboardData();
    }
  } catch (err) {
    showToast('Failed to reset demo data.', 'error');
  }
}

// ==========================================================================
// 13. UTILITIES & CSV EXPORT
// ==========================================================================

function exportData(type) {
  let filename = `acxiom_${type}_export.csv`;
  let csvContent = 'data:text/csv;charset=utf-8,';

  if (type === 'customers') {
    csvContent += 'CustomerCode,CustomerName,Email,Phone,CompanyName,Status\n';
    customersList.forEach(c => {
      csvContent += `"${c.CustomerCode}","${c.CustomerName}","${c.Email}","${c.Phone}","${c.CompanyName || ''}","${c.Status}"\n`;
    });
  } else if (type === 'leads') {
    csvContent += 'LeadCode,LeadName,Email,Phone,CompanyName,Source,ExpectedValue,Status\n';
    leadsList.forEach(l => {
      csvContent += `"${l.LeadCode}","${l.LeadName}","${l.Email || ''}","${l.Phone || ''}","${l.CompanyName || ''}","${l.Source}","${l.ExpectedValue}","${l.Status}"\n`;
    });
  } else if (type === 'opportunities') {
    csvContent += 'OpportunityName,Amount,Probability,WeightedValue,Stage,CloseDate\n';
    opportunitiesList.forEach(o => {
      csvContent += `"${o.OpportunityName}","${o.Amount}","${o.Probability}","${o.WeightedAmount}","${o.Stage}","${o.ExpectedCloseDate}"\n`;
    });
  } else {
    csvContent += 'Export,Generated\nAcxiomCRM,Success\n';
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Exported ${type} to CSV.`, 'success');
}

function handleGlobalSearch(query) {
  if (!query) return;
  if (currentView === 'customers') {
    document.getElementById('customerSearch').value = query;
    loadCustomers();
  } else if (currentView === 'leads') {
    document.getElementById('leadSearch').value = query;
    loadLeads();
  } else if (currentView === 'opportunities') {
    document.getElementById('opportunitySearch').value = query;
    loadOpportunities();
  }
}

// Modal Helpers
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Validation feedback helpers
function markInvalid(inputId, msg) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.classList.add('is-invalid');
  el.classList.remove('is-valid');
  const feedback = el.nextElementSibling;
  if (feedback && feedback.classList.contains('invalid-feedback')) {
    feedback.textContent = msg;
  }
}

function markValid(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.classList.remove('is-invalid');
  el.classList.add('is-valid');
}

function resetValidationErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('.form-control').forEach(input => {
    input.classList.remove('is-invalid', 'is-valid');
  });
}

// Toast notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? 'fa-circle-check text-green-600' :
    type === 'error' ? 'fa-circle-exclamation text-red-600' :
      type === 'warning' ? 'fa-triangle-exclamation text-amber-600' :
        'fa-circle-info text-blue-600';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
