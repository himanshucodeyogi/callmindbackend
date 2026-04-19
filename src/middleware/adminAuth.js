const adminAuth = (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (!key || key !== process.env.ADMIN_KEY) {
    // If browser request (no key), serve the dashboard login
    if (req.path === '/dashboard' && req.method === 'GET' && !key) {
      return next(); // dashboard HTML handles auth itself
    }
    return res.status(401).json({ error: 'Invalid admin key' });
  }
  next();
};

module.exports = adminAuth;
