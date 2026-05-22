const express = require('express');
const Feedback = require('../models/feedback');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications/admin — pending complaints count (admin only)
router.get('/admin', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const pendingComplaints = await Feedback.countDocuments({
      type: 'complaint',
      status: 'pending',
    });
    res.json({ pendingComplaints });
  } catch (err) {
    res.status(500).json({ message: err.message ?? 'Server error' });
  }
});

module.exports = router;
