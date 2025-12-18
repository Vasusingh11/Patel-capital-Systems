const jwt = require('jsonwebtoken');
const { query } = require('../database/db');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token, access denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const result = await query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Check if user is admin or owner of resource
const isAdminOrOwner = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    if (req.user.role === 'admin') {
      next();
    } else if (req.params[resourceUserIdField] === req.user.id || req.body[resourceUserIdField] === req.user.id) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }
  };
};

module.exports = {
  auth,
  isAdmin,
  isAdminOrOwner
};

