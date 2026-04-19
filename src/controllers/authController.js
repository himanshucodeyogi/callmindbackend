const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ok } = require('../utils/responseFormatter');

const register = async (req, res) => {
  const { deviceId, name } = req.body;

  if (!deviceId || !name) {
    return res.status(400).json({ error: 'deviceId and name are required' });
  }

  // Upsert — same device re-registers (e.g. app reinstall) gets same userId
  const user = await User.findOneAndUpdate(
    { deviceId },
    { name: name.trim() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '365d',
  });

  ok(res, { userId: user._id, token }, 201);
};

module.exports = { register };
