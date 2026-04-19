const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    recordingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recording', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    description: { type: String, required: true },
    dueDate: { type: Date, default: null },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
