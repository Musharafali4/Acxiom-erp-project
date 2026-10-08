const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const config = require('./src/config/config');
const apiRoutes = require('./src/routes/apiRoutes');

const app = express();

// Security and utility middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Anti-tamper & standard security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// REST API routes
app.use('/api', apiRoutes);

// Static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback for non-API routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred. Please contact the administrator.'
  });
});

const PORT = config.PORT || 5000;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  AcxiomCRM Enterprise System running on port ${PORT}`);
  console.log(`  Access URL: http://localhost:${PORT}`);
  console.log(`  Pre-seeded Test Accounts:`);
  console.log(`  - Admin: admin@acxiom.com / Admin@123!`);
  console.log(`  - Manager: manager@acxiom.com / Password@123!`);
  console.log(`  - Sales: sarah.sales@acxiom.com / Password@123!`);
  console.log(`====================================================`);
});
