const summaryPrompt = (transcript) => `
You are an AI assistant that creates concise summaries of conversation transcripts.

Given the transcript below, write a clear 2-4 sentence summary covering:
- What was discussed
- Any decisions made
- Key outcomes

Keep it factual and concise. Do not add commentary.

TRANSCRIPT:
${transcript}
`.trim();

const taskExtractionPrompt = (transcript) => `
You are an AI that extracts action items and commitments from conversation transcripts.

Given the transcript below, extract ALL tasks, commitments, deadlines, and action items.

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "description": "clear description of what needs to be done",
    "dueDate": "ISO8601 datetime string or null if no deadline mentioned"
  }
]

Rules:
- Extract both explicit ("I will send") and implicit commitments
- For relative dates (tomorrow, next week), compute from today: ${new Date().toISOString().split('T')[0]}
- If no tasks found, return an empty array: []
- Return ONLY the JSON array, nothing else

TRANSCRIPT:
${transcript}
`.trim();

module.exports = { summaryPrompt, taskExtractionPrompt };
