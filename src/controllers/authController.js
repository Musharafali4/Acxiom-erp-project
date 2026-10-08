const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const config = require('../config/config');
const { validatePasswordPolicy } = require('../middleware/validation');

exports.login = (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.'
    });
  }

  const user = db.findUserByEmail(email);

  if (!user) {
    db.logAudit({
      userId: 'anonymous',
      action: 'Failed Login',
      entityName: 'Authentication',
      recordId: email,
      oldValue: null,
      newValue: 'Failed login attempt - user not found',
      ipAddress: ip
    });
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.'
    });
  }

  // Check account active status
  if (!user.IsActive) {
    return res.status(403).json({
      success: false,
      message: 'Account has been deactivated. Please contact your system administrator.'
    });
  }

  // Check lockout
  if (user.LockoutEnd) {
    const lockExpiry = new Date(user.LockoutEnd);
    if (lockExpiry > new Date()) {
      const remainingMinutes = Math.ceil((lockExpiry - new Date()) / 60000);
      db.logAudit({
        userId: user.UserId,
        action: 'Failed Login',
        entityName: 'Authentication',
        recordId: user.UserId,
        oldValue: null,
        newValue: `Login blocked by lockout. Lockout expires in ${remainingMinutes} minute(s)`,
        ipAddress: ip
      });
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to repeated failed login attempts. Try again in ${remainingMinutes} minute(s).`
      });
    } else {
      // Lockout expired, reset counter
      db.resetFailedLogin(user);
    }
  }

  // Compare password
  const isValid = bcrypt.compareSync(password, user.PasswordHash);
  if (!isValid) {
    const lockoutState = db.recordFailedLogin(
      user,
      config.LOCKOUT_POLICY.lockoutDurationMinutes,
      config.LOCKOUT_POLICY.maxFailedAttempts
    );

    db.logAudit({
      userId: user.UserId,
      action: 'Failed Login',
      entityName: 'Authentication',
      recordId: user.UserId,
      oldValue: null,
      newValue: `Incorrect password attempt #${lockoutState.failedCount}${lockoutState.isLocked ? ' - Account Locked' : ''}`,
      ipAddress: ip
    });

    if (lockoutState.isLocked) {
      return res.status(423).json({
        success: false,
        message: `Account locked after ${config.LOCKOUT_POLICY.maxFailedAttempts} consecutive failed login attempts. Please wait ${config.LOCKOUT_POLICY.lockoutDurationMinutes} minutes or contact an Admin.`
      });
    }

    const attemptsRemaining = config.LOCKOUT_POLICY.maxFailedAttempts - lockoutState.failedCount;
    return res.status(401).json({
      success: false,
      message: `Invalid email or password. ${attemptsRemaining} attempt(s) remaining before account lockout.`
    });
  }

  // Login successful
  db.resetFailedLogin(user);

  const tokenPayload = {
    userId: user.UserId,
    email: user.Email,
    role: user.RoleName
  };

  const token = jwt.sign(tokenPayload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRY
  });

  // Set HTTP-only secure cookie
  res.cookie('acxiom_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  });

  db.logAudit({
    userId: user.UserId,
    action: 'Login',
    entityName: 'Authentication',
    recordId: user.UserId,
    oldValue: null,
    newValue: `User successfully logged in as ${user.RoleName}`,
    ipAddress: ip
  });

  const { PasswordHash, ...sanitizedUser } = user;

  res.status(200).json({
    success: true,
    message: 'Authentication successful.',
    token,
    user: sanitizedUser
  });
};

exports.register = (req, res) => {
  const { name, email, password, roleName } = req.body;
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Name is required.' });
  }

  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const existing = db.findUserByEmail(email.trim());
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'A user account with this email already exists.'
    });
  }

  const policyErrors = validatePasswordPolicy(password);
  if (policyErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet enterprise security policy.',
      errors: policyErrors
    });
  }

  // Determine role (default to SalesExecutive if not specified or restricted)
  const targetRoleName = ['Admin', 'Manager', 'SalesExecutive'].includes(roleName)
    ? roleName
    : 'SalesExecutive';

  const role = db.getRoles().find(r => r.RoleName === targetRoleName);

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = db.createUser({
    Name: name.trim(),
    Email: email.trim(),
    PasswordHash: passwordHash,
    RoleId: role ? role.RoleId : 'role-3',
    RoleName: targetRoleName,
    IsActive: true
  });

  db.logAudit({
    userId: newUser.UserId,
    action: 'Create',
    entityName: 'User Registration',
    recordId: newUser.UserId,
    oldValue: null,
    newValue: `User registered with role ${targetRoleName}`,
    ipAddress: ip
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully. You can now log in.',
    user: newUser
  });
};

exports.logout = (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  if (req.user) {
    db.logAudit({
      userId: req.user.UserId,
      action: 'Logout',
      entityName: 'Authentication',
      recordId: req.user.UserId,
      oldValue: null,
      newValue: 'User logged out',
      ipAddress: ip
    });
  }

  res.clearCookie('acxiom_token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

exports.me = (req, res) => {
  const user = db.findUserById(req.user.UserId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const { PasswordHash, ...sanitized } = user;
  res.status(200).json({
    success: true,
    user: sanitized
  });
};
