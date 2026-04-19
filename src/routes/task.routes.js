const router = require('express').Router();
const auth = require('../middleware/auth');
const { getAll, updateCompletion, remove } = require('../controllers/taskController');

router.use(auth);

router.get('/', getAll);
router.patch('/:id', updateCompletion);
router.delete('/:id', remove);

module.exports = router;
