const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../database/db');

function authenticate(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.acxiom_token) {
    token = req.cookies.acxiom_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No session or token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = db.findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session: User no longer exists.'
      });
    }

    if (!user.IsActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Contact an administrator.'
      });
    }

    // Attach user (without password hash)
    req.user = {
      UserId: user.UserId,
      Name: user.Name,
      Email: user.Email,
      RoleId: user.RoleId,
      RoleName: user.RoleName
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is invalid or has expired.'
    });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.RoleName)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Current role: ${req.user.RoleName}`
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize
};
