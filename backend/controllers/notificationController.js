const Feedback = require('../models/feedback');

async function adminNotifications(req, res) {
  try {
    const [pendingComplaints, escalations] = await Promise.all([
      Feedback.countDocuments({ type: 'complaint', status: 'pending' }),
      Feedback.countDocuments({ status: 'escalated' }),
    ]);
    res.json({ pendingComplaints, escalations });
  } catch (err) {
    res.status(500).json({ message: err.message ?? 'Server error' });
  }
}

module.exports = { adminNotifications };
