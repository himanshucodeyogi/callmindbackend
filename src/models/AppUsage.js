const mongoose = require('mongoose');

const appUsageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      enum: ['recording_started', 'recording_uploaded', 'recording_failed',
             'task_completed', 'task_deleted', 'reminder_set', 'app_opened'],
      required: true,
    },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

appUsageSchema.index({ createdAt: -1 });
appUsageSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AppUsage', appUsageSchema);
