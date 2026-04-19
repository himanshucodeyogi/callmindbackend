const { getGroq } = require('../config/groq');
const { summaryPrompt, taskExtractionPrompt } = require('../utils/promptTemplates');

/**
 * Transcribe audio buffer using Groq Whisper.
 * Audio is passed as an in-memory buffer — never written to disk.
 */
const transcribeAudio = async (buffer, originalName) => {
  const groq = getGroq();
  // Groq SDK requires a File-like object; use a Blob
  const blob = new Blob([buffer], { type: 'audio/m4a' });
  const file = new File([blob], originalName || 'recording.m4a', { type: 'audio/m4a' });

  const response = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    response_format: 'text',
    language: 'hi', // supports Hindi + English (code-switch friendly)
  });

  return typeof response === 'string' ? response : response.text;
};

/**
 * Generate a concise summary of the transcript using LLaMA.
 */
const generateSummary = async (transcript) => {
  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'user', content: summaryPrompt(transcript) },
    ],
    temperature: 0.3,
    max_tokens: 300,
  });

  return completion.choices[0].message.content.trim();
};

/**
 * Extract tasks/action items from transcript using LLaMA.
 * Returns a parsed array of { description, dueDate } objects.
 */
const extractTasks = async (transcript) => {
  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'user', content: taskExtractionPrompt(transcript) },
    ],
    temperature: 0.1, // low temp for deterministic JSON output
    max_tokens: 1000,
  });

  const raw = completion.choices[0].message.content.trim();

  try {
    // Strip markdown code blocks if model added them
    const jsonStr = raw.replace(/```(?:json)?\n?/g, '').trim();
    const tasks = JSON.parse(jsonStr);
    return Array.isArray(tasks) ? tasks : [];
  } catch {
    console.error('Task extraction JSON parse failed:', raw);
    return [];
  }
};

module.exports = { transcribeAudio, generateSummary, extractTasks };
