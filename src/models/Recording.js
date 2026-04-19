const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    durationSeconds: { type: Number, required: true },
    transcript: { type: String, default: null },
    summary: { type: String, default: null },
    status: {
      type: String,
      enum: ['uploaded', 'transcribing', 'summarizing', 'extracting', 'complete', 'failed'],
      default: 'uploaded',
    },
  },
  { timestamps: true }
);

// No audioUrl field — audio is never stored (processed in-memory only)

module.exports = mongoose.model('Recording', recordingSchema);
