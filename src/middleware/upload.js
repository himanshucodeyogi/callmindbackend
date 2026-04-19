const multer = require('multer');

// memoryStorage — audio buffer stays in RAM, never written to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/aac',
                     'audio/wav', 'audio/webm', 'audio/ogg', 'video/mp4'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(m4a|mp3|wav|aac|webm|ogg)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported audio format'));
    }
  },
});

module.exports = upload;
