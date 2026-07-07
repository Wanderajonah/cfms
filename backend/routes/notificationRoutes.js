const express = require('express');
const Feedback = require('../models/feedback');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications/admin — pending complaints & escalated count (admin only)
router.get('/admin', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const [pendingComplaints, escalations] = await Promise.all([
      Feedback.countDocuments({ type: 'complaint', status: 'pending' }),
      Feedback.countDocuments({ status: 'escalated' }),
    ]);
    res.json({ pendingComplaints, escalations });
  } catch (err) {
    res.status(500).json({ message: err.message ?? 'Server error' });
  }
});

module.exports = router;
