const router = require('express').Router();
const path = require('path');
const adminAuth = require('../middleware/adminAuth');
const { getStats, getTopUsers, getFeatureUsage, getRecentActivity } = require('../controllers/adminController');

// Dashboard HTML — served without key (HTML handles auth)
router.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});

// API routes — all require X-Admin-Key header
router.use(adminAuth);
router.get('/stats', getStats);
router.get('/top-users', getTopUsers);
router.get('/feature-usage', getFeatureUsage);
router.get('/recent', getRecentActivity);

module.exports = router;
