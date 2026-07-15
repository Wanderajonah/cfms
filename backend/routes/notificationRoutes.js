const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { adminNotifications } = require('../controllers/notificationController');

const router = express.Router();

router.get('/admin', requireAuth, requireRole('admin'), adminNotifications);

module.exports = router;
