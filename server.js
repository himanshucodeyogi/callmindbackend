require('dotenv').config();
const app = require('./src/app');

// Local dev — listen on port
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`CallMind backend running on port ${PORT}`);
  });
}

// Vercel — export app as serverless function
module.exports = app;
