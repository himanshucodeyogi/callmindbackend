const router = require('express').Router();
const auth = require('../middleware/auth');
const { process, getStatus, getAll, remove } = require('../controllers/recordingController');

router.use(auth);

router.post('/process', process);
router.get('/', getAll);
router.get('/:id/status', getStatus);
router.delete('/:id', remove);

module.exports = router;
