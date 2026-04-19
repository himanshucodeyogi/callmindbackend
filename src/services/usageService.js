const AppUsage = require('../models/AppUsage');

const track = (userId, action, meta = {}) => {
  // Fire-and-forget — never block request for analytics
  AppUsage.create({ userId, action, meta }).catch(() => {});
};

module.exports = { track };
