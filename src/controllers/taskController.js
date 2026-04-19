const Task = require('../models/Task');
const { track } = require('../services/usageService');
const { ok, fail } = require('../utils/responseFormatter');

const getAll = async (req, res) => {
  const { status } = req.query;
  const filter = { userId: req.userId };

  if (status === 'pending') filter.isCompleted = false;
  else if (status === 'completed') filter.isCompleted = true;

  const tasks = await Task.find(filter).sort({ dueDate: 1, createdAt: 1 }).lean();

  ok(res, {
    tasks: tasks.map((t) => ({
      _id: t._id,
      recordingId: t.recordingId,
      description: t.description,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      isCompleted: t.isCompleted,
      createdAt: t.createdAt,
    })),
  });
};

const updateCompletion = async (req, res) => {
  const { isCompleted } = req.body;
  if (typeof isCompleted !== 'boolean') {
    return fail(res, 'isCompleted must be a boolean');
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { isCompleted },
    { new: true }
  );

  if (!task) return fail(res, 'Task not found', 404);
  if (isCompleted) track(req.userId, 'task_completed');
  ok(res, { task });
};

const remove = async (req, res) => {
  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });

  if (!task) return fail(res, 'Task not found', 404);
  track(req.userId, 'task_deleted');
  ok(res, { success: true });
};

module.exports = { getAll, updateCompletion, remove };
