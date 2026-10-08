const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { validatePasswordPolicy } = require('../middleware/validation');

exports.getUsers = (req, res) => {
  const users = db.getUsers();
  // Compute isLocked flag for display
  const enriched = users.map(u => ({
    ...u,
    IsLocked: Boolean(u.LockoutEnd && new Date(u.LockoutEnd) > new Date())
  }));

  res.status(200).json({
    success: true,
    data: enriched
  });
};

exports.getRoles = (req, res) => {
  res.status(200).json({
    success: true,
    data: db.getRoles()
  });
};

exports.createUser = (req, res) => {
  const { Name, Email, Password, RoleName } = req.body;
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';

  if (!Name || !Name.trim()) {
    return res.status(400).json({ success: false, message: 'User Name is required.' });
  }

  if (!Email || !Email.trim()) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const existing = db.findUserByEmail(Email.trim());
  if (existing) {
    return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
  }

  const policyErrors = validatePasswordPolicy(Password);
  if (policyErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Password does not satisfy enterprise security policy.',
      errors: policyErrors
    });
  }

  const validRoles = ['Admin', 'Manager', 'SalesExecutive'];
  const role = validRoles.includes(RoleName) ? RoleName : 'SalesExecutive';
  const roleObj = db.getRoles().find(r => r.RoleName === role);

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(Password, salt);

  const newUser = db.createUser({
    Name: Name.trim(),
    Email: Email.trim(),
    PasswordHash: passwordHash,
    RoleId: roleObj ? roleObj.RoleId : 'role-3',
    RoleName: role,
    IsActive: true
  });

  db.logAudit({
    userId: req.user.UserId,
    action: 'Create',
    entityName: 'User Management',
    recordId: newUser.UserId,
    oldValue: null,
    newValue: `Created new user ${newUser.Name} (${newUser.Email}) with role ${newUser.RoleName}`,
    ipAddress: ip
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully.',
    data: newUser
  });
};

exports.updateUser = (req, res) => {
  const userId = req.params.id;
  const existing = db.findUserById(userId);

  if (!existing) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const { Name, RoleName, IsActive } = req.body;
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';

  const updates = {};
  if (Name && Name.trim()) updates.Name = Name.trim();
  if (RoleName && ['Admin', 'Manager', 'SalesExecutive'].includes(RoleName)) {
    updates.RoleName = RoleName;
    const r = db.getRoles().find(role => role.RoleName === RoleName);
    if (r) updates.RoleId = r.RoleId;
  }
  if (IsActive !== undefined) updates.IsActive = Boolean(IsActive);

  const updated = db.updateUser(userId, updates);

  db.logAudit({
    userId: req.user.UserId,
    action: 'Update',
    entityName: 'User Management',
    recordId: userId,
    oldValue: JSON.stringify({ Name: existing.Name, RoleName: existing.RoleName, IsActive: existing.IsActive }),
    newValue: JSON.stringify(updates),
    ipAddress: ip
  });

  res.status(200).json({
    success: true,
    message: 'User profile updated successfully.',
    data: updated
  });
};

exports.toggleLockout = (req, res) => {
  const userId = req.params.id;
  const user = db.findUserById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const isCurrentlyLocked = Boolean(user.LockoutEnd && new Date(user.LockoutEnd) > new Date());

  if (isCurrentlyLocked) {
    // Unlock
    db.resetFailedLogin(user);
    db.logAudit({
      userId: req.user.UserId,
      action: 'Security',
      entityName: 'User Management',
      recordId: userId,
      oldValue: 'Account Locked',
      newValue: 'Admin manually unlocked account and cleared failed attempts counter',
      ipAddress: ip
    });
    return res.status(200).json({
      success: true,
      message: `Account for ${user.Name} has been unlocked successfully.`
    });
  } else {
    // Manually lock account for 60 minutes
    const lockDate = new Date();
    lockDate.setMinutes(lockDate.getMinutes() + 60);
    user.LockoutEnd = lockDate.toISOString();
    user.FailedLoginCount = 5;
    db.save();

    db.logAudit({
      userId: req.user.UserId,
      action: 'Security',
      entityName: 'User Management',
      recordId: userId,
      oldValue: 'Account Active',
      newValue: 'Admin manually locked account for 60 minutes',
      ipAddress: ip
    });

    return res.status(200).json({
      success: true,
      message: `Account for ${user.Name} has been locked.`
    });
  }
};

exports.resetPassword = (req, res) => {
  const userId = req.params.id;
  const user = db.findUserById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const { newPassword } = req.body;
  const policyErrors = validatePasswordPolicy(newPassword);

  if (policyErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet enterprise requirements.',
      errors: policyErrors
    });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(newPassword, salt);
  db.updateUser(userId, { PasswordHash: passwordHash });

  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  db.logAudit({
    userId: req.user.UserId,
    action: 'Security',
    entityName: 'User Management',
    recordId: userId,
    oldValue: null,
    newValue: `Administrator reset password for ${user.Email}`,
    ipAddress: ip
  });

  res.status(200).json({
    success: true,
    message: `Password reset successfully for ${user.Name}.`
  });
};
