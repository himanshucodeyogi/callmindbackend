const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { upload: uploadRecording, getStatus, getAll, remove } = require('../controllers/recordingController');

router.use(auth);

router.post('/upload', upload.single('audio'), uploadRecording);
router.get('/', getAll);
router.get('/:id/status', getStatus);
router.delete('/:id', remove);

module.exports = router;
