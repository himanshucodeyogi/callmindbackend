const Recording = require('../models/Recording');
const Task = require('../models/Task');
const { transcribeAudio, generateSummary, extractTasks } = require('./groqService');

/**
 * Full async AI pipeline — runs after upload response is sent.
 * Audio buffer is processed in RAM and discarded after this function.
 */
const runPipeline = async (recordingId, userId, audioBuffer, originalName) => {
  try {
    // Step 1: Transcribe
    await Recording.findByIdAndUpdate(recordingId, { status: 'transcribing' });
    const transcript = await transcribeAudio(audioBuffer, originalName);

    // Step 2: Summarize
    await Recording.findByIdAndUpdate(recordingId, { status: 'summarizing' });
    const summary = await generateSummary(transcript);

    // Step 3: Extract tasks
    await Recording.findByIdAndUpdate(recordingId, { status: 'extracting' });
    const rawTasks = await extractTasks(transcript);

    // Step 4: Save results — audio buffer is now garbage collected
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
      transcript,
      summary,
      status: 'complete',
    });
  } catch (err) {
    console.error(`Pipeline failed for recording ${recordingId}:`, err.message);
    await Recording.findByIdAndUpdate(recordingId, { status: 'failed' });
  }
};

module.exports = { runPipeline };
