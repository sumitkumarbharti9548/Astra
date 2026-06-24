// middleware/auth.js — Protects routes by verifying JWT tokens
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check Authorization header for "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — no token provided'
    });
  }

  try {
    // Verify token using our JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request object (so controllers can access req.user)
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found — token invalid'
      });
    }

    next(); // Token is valid, proceed to the route handler
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — token expired or invalid'
    });
  }
};

module.exports = { protect };
