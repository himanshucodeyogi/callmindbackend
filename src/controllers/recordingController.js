const Recording = require('../models/Recording');
const Task = require('../models/Task');
const { runPipeline } = require('../services/processingPipeline');
const { track } = require('../services/usageService');
const { ok, fail } = require('../utils/responseFormatter');

// Receives transcript text from app (audio never sent to backend)
const process = async (req, res) => {
  const { transcript, title, durationSeconds } = req.body;

  if (!transcript || !title || !durationSeconds) {
    return fail(res, 'transcript, title, and durationSeconds are required');
  }

  const recording = await Recording.create({
    userId: req.userId,
    title,
    durationSeconds: parseInt(durationSeconds),
    transcript,
    status: 'summarizing',
  });

  track(req.userId, 'recording_uploaded', {
    durationSeconds: parseInt(durationSeconds),
  });

  // Respond immediately — pipeline runs async in background
  ok(res, { recordingId: recording._id, status: 'summarizing' }, 201);

  // Only need summary + task extraction (transcription done on device)
  runPipeline(recording._id, req.userId, transcript);
};

const getStatus = async (req, res) => {
  const recording = await Recording.findOne({
    _id: req.params.id,
    userId: req.userId,
  }).lean();

  if (!recording) return fail(res, 'Recording not found', 404);

  const response = { status: recording.status };

  if (recording.status === 'complete') {
    const tasks = await Task.find({ recordingId: recording._id }).lean();
    response.transcript = recording.transcript;
    response.summary = recording.summary;
    response.tasks = tasks.map((t) => ({
      _id: t._id,
      recordingId: t.recordingId,
      description: t.description,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      isCompleted: t.isCompleted,
    }));
  }

  ok(res, response);
};

const getAll = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [recordings, total] = await Promise.all([
    Recording.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Recording.countDocuments({ userId: req.userId }),
  ]);

  ok(res, {
    recordings: recordings.map((r) => ({
      _id: r._id,
      title: r.title,
      durationSeconds: r.durationSeconds,
      summary: r.summary,
      status: r.status,
      createdAt: r.createdAt,
    })),
    total,
    page,
  });
};

const remove = async (req, res) => {
  const recording = await Recording.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });

  if (!recording) return fail(res, 'Recording not found', 404);

  await Task.deleteMany({ recordingId: req.params.id });
  ok(res, { success: true });
};

module.exports = { process, getStatus, getAll, remove };
