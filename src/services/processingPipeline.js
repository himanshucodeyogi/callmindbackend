const Recording = require('../models/Recording');
const Task = require('../models/Task');
const { generateSummary, extractTasks } = require('./groqService');

// Pipeline starts from transcript (transcription done on device via Android STT)
const runPipeline = async (recordingId, userId, transcript) => {
  try {
    // Step 1: Summarize
    await Recording.findByIdAndUpdate(recordingId, { status: 'summarizing' });
    const summary = await generateSummary(transcript);

    // Step 2: Extract tasks
    await Recording.findByIdAndUpdate(recordingId, { status: 'extracting' });
    const rawTasks = await extractTasks(transcript);

    // Step 3: Save results
    const tasks = rawTasks.map((t) => ({
      recordingId,
      userId,
      description: t.description,
      dueDate: t.dueDate ? new Date(t.dueDate) : null,
    }));

    if (tasks.length > 0) {
      await Task.insertMany(tasks);
    }

    await Recording.findByIdAndUpdate(recordingId, {
      summary,
      status: 'complete',
    });
  } catch (err) {
    console.error(`Pipeline failed for recording ${recordingId}:`, err.message);
    await Recording.findByIdAndUpdate(recordingId, { status: 'failed' });
  }
};

module.exports = { runPipeline };
