const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  summary,
  list,
  getById,
  create,
  assign,
  respond,
  resolve,
  escalate,
  update,
  remove,
} = require('../controllers/feedbackController');

const router = express.Router();

router.get('/summary', requireAuth, requireRole('admin'), summary);
router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.post('/:id/assign', requireAuth, requireRole('admin'), assign);
router.post('/:id/respond', requireAuth, requireRole('admin', 'staff'), respond);
router.post('/:id/resolve', requireAuth, requireRole('admin', 'staff'), resolve);
router.post('/:id/escalate', requireAuth, requireRole('admin', 'staff'), escalate);
router.patch('/:id', requireAuth, requireRole('admin', 'staff'), update);
router.delete('/:id', requireAuth, requireRole('admin'), remove);

module.exports = router;
