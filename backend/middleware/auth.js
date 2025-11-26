// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  try {
    let token = req.headers.authorization || req.headers.Authorization;
    if (!token) return res.status(401).json({ error: 'No token provided (look for Authorization header)' });

    if (typeof token !== 'string') return res.status(400).json({ error: 'Invalid Authorization header type' });

    if (token.startsWith && token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment!');
      return res.status(500).json({ error: 'Server misconfiguration: missing JWT secret' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error('JWT verify error:', err);
      if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded && (decoded.id || decoded.userId);
    if (!userId) return res.status(401).json({ error: 'Token does not contain user id' });

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: 'Invalid user id in token' });
    }

    const user = await User.findById(userId).select('-passwordHash -salt');
    if (!user) return res.status(401).json({ error: 'Invalid token (user not found)' });
    if (user.isBlocked) return res.status(403).json({ error: 'Account blocked' });

    if (typeof decoded.tokenVersion !== 'undefined' && decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ error: 'Token invalidated' });
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (err) {
    console.error('Unexpected auth error:', err);
    return res.status(500).json({ error: 'Internal server error in auth middleware' });
  }
};
