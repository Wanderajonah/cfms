const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { list, create, remove } = require('../controllers/contactController');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), list);
router.post('/', requireAuth, requireRole('admin'), create);
router.delete('/:id', requireAuth, requireRole('admin'), remove);

module.exports = router;
