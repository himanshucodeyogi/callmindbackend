const Recording = require('../models/Recording');
const Task = require('../models/Task');
const { generateSummary, extractTasks } = require('./groqService');

// Transcript already done on device — backend only does summary + task extraction
const runPipeline = async (recordingId, userId, transcript) => {
  try {
    await Recording.findByIdAndUpdate(recordingId, { status: 'summarizing' });
    const summary = await generateSummary(transcript);

    await Recording.findByIdAndUpdate(recordingId, { status: 'extracting' });
    const rawTasks = await extractTasks(transcript);

    const tasks = rawTasks.map((t) => ({
      recordingId,
      userId,
      description: t.description,
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
    }));

    if (tasks.length > 0) await Task.insertMany(tasks);

    await Recording.findByIdAndUpdate(recordingId, { summary, status: 'complete' });
  } catch (err) {
    console.error(`Pipeline failed for ${recordingId}:`, err.message, err.status ?? '');
    await Recording.findByIdAndUpdate(recordingId, { status: 'failed' });
  }
};

module.exports = { runPipeline };
