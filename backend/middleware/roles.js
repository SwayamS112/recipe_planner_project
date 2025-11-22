// backend/middleware/roles.js
module.exports = function requireRole(roles = []) {
  if (!Array.isArray(roles)) roles = [roles];
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(role)) return res.status(403).json({ error: 'Forbidden: insufficient role' });
    next();
  };
};
