const Groq = require('groq-sdk');

// Lazy init so startup doesn't fail if env not loaded yet
let _client = null;

const getGroq = () => {
  if (!_client) {
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _client;
};

module.exports = { getGroq };
