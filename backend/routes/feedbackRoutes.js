const express = require('express');
const mongoose = require('mongoose');
const Feedback = require('../models/feedback');
const Counter = require('../models/Counter');
const { requireAuth, requireRole } = require('../middleware/auth');
const Contact = require('../models/Contact');
const { sendSms } = require('../services/commsSms');
const { scheduleAutoAiFeedbackSms } = require('../services/autoAiFeedbackSms');

const router = express.Router();

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function monthLabel(date) {
  return date.toLocaleString('en-US', { month: 'short' });
}

function dayLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// GET /api/feedback/summary  (admin only)
router.get('/summary', requireAuth, requireRole('admin'), async (req, res) => {
  try {
  const months = parsePositiveInt(req.query.months, 6);
  const days = parsePositiveInt(req.query.days, 30);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));

    const [total, byStatus, categories, monthlyAgg, dailyAgg, avgResponseAgg] = await Promise.all([
      Feedback.countDocuments({}),
      Feedback.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Feedback.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Feedback.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Feedback.aggregate([
        { $match: { createdAt: { $gte: dayStart } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      Feedback.aggregate([
        { $match: { respondedAt: { $type: 'date' } } },
        { $project: { diffMs: { $subtract: ['$respondedAt', '$createdAt'] } } },
        { $group: { _id: null, avgMs: { $avg: '$diffMs' } } },
      ]),
    ]);

    const statusTotals = {
      pending: 0,
      'in-progress': 0,
      resolved: 0,
      escalated: 0,
    };
    for (const row of byStatus) {
      if (row._id && statusTotals[row._id] !== undefined) statusTotals[row._id] = row.count;
    }

    const monthlyMap = new Map();
    monthlyAgg.forEach((row) => {
      monthlyMap.set(`${row._id.year}-${row._id.month}`, { total: row.total, resolved: row.resolved });
    });

    const monthly = [];
    for (let i = 0; i < months; i += 1) {
      const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const found = monthlyMap.get(key) || { total: 0, resolved: 0 };
      monthly.push({ month: monthLabel(date), total: found.total, resolved: found.resolved });
    }

    const dailyMap = new Map();
    dailyAgg.forEach((row) => {
      dailyMap.set(`${row._id.year}-${row._id.month}-${row._id.day}`, { total: row.total, resolved: row.resolved });
    });

    const daily = [];
    for (let i = 0; i < days; i += 1) {
      const date = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() + i);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const found = dailyMap.get(key) || { total: 0, resolved: 0 };
      daily.push({ date: dayLabel(date), total: found.total, resolved: found.resolved });
    }

    const avgResponseHours = avgResponseAgg[0]?.avgMs
      ? Number((avgResponseAgg[0].avgMs / (1000 * 60 * 60)).toFixed(1))
      : null;

    res.json({
      totals: {
        total,
        pending: statusTotals.pending,
        inProgress: statusTotals['in-progress'],
        resolved: statusTotals.resolved,
        escalated: statusTotals.escalated,
      },
      categories: categories.map((row) => ({ name: row._id, value: row.count })),
      monthly,
      daily,
      avgResponseHours,
    });
  } catch (err) {
    res.status(500).json({ message: err.message ?? 'Server error' });
  }
});

// GET /api/feedback
// Supports: ?status=&category=&type=&priority=&assignedTo=&search=&page=&limit=&sort=
router.get('/', async (req, res) => {
  try {
    const {
      status,
      category,
      type,
      priority,
      assignedTo,
      search,
      sort = '-createdAt',
    } = req.query;

    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = String(status);
    if (category) filter.category = String(category);
    if (type) filter.type = String(type);
    if (priority) filter.priority = String(priority);
    if (assignedTo) filter.assignedTo = String(assignedTo);

    if (search && String(search).trim()) {
      filter.$text = { $search: String(search).trim() };
    }

    const [items, total] = await Promise.all([
      Feedback.find(filter)
        .sort(String(sort))
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(filter),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message ?? 'Server error' });
  }
});

// GET /api/feedback/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid feedback id' });
    }

    const feedback = await Feedback.findById(id).lean();
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message ?? 'Server error' });
  }
});

// POST /api/feedback
router.post('/', async (req, res) => {
  try {
    const ticketNumber = await Counter.getNextSequence('feedback');
    const feedback = await Feedback.create({ ...req.body, ticketNumber });
    // AI SMS automation: retries within ~2 min (see AUTO_AI_SMS_* and GROQ_API_KEY in backend/.env)
    setImmediate(() => {
      try {
        scheduleAutoAiFeedbackSms(String(feedback._id));
      } catch (e) {
        console.error('[auto-ai-sms] schedule failed', feedback._id, e);
      }
    });
    res.status(201).json(feedback);
  } catch (err) {
    res.status(400).json({ message: err.message ?? 'Invalid request' });
  }
});

// POST /api/feedback/:id/assign  (admin only)
router.post('/:id/assign', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid feedback id' });
    }

    const { assignedTo } = req.body ?? {};
    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { assignedTo: assignedTo ? String(assignedTo) : null, status: 'in-progress' },
      { new: true, runValidators: true }
    );
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ message: err.message ?? 'Invalid request' });
  }
});

// POST /api/feedback/:id/respond  (admin/staff)
router.post('/:id/respond', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid feedback id' });
    }

    const { response, sendSms: shouldSendSms, toNumber, contactId } = req.body ?? {};
    if (!response || !String(response).trim()) {
      return res.status(400).json({ message: 'Response is required' });
    }

    const trimmed = String(response).trim();

    let smsResult = null;
    let smsError = null;
    if (shouldSendSms) {
      let number = toNumber ? String(toNumber) : null;
      if (!number && contactId && mongoose.isValidObjectId(String(contactId))) {
        const contact = await Contact.findById(String(contactId)).lean();
        number = contact?.phone ? String(contact.phone) : null;
      }
      // Pull feedback phone only if needed
      if (!number) {
        const fb = await Feedback.findById(id).select('phone').lean();
        if (fb?.phone) number = String(fb.phone);
      }
      if (!number) return res.status(400).json({ message: 'Missing recipient phone number' });

      try {
        smsResult = await sendSms({ toNumber: number, message: trimmed });
      } catch (e) {
        smsError = e?.message || 'SMS failed';
      }
    }

    const updated = await Feedback.findByIdAndUpdate(
      id,
      { response: trimmed, respondedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Feedback not found' });

    res.json({ feedback: updated, smsResult, smsError });
  } catch (err) {
    res.status(400).json({ message: err.message ?? 'Invalid request' });
  }
});

// POST /api/feedback/:id/resolve  (admin/staff)
router.post('/:id/resolve', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid feedback id' });
    }

    const { staffNotes } = req.body ?? {};
    const update = { status: 'resolved', resolvedAt: new Date() };
    if (typeof staffNotes === 'string') update.staffNotes = staffNotes;

    const feedback = await Feedback.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ message: err.message ?? 'Invalid request' });
  }
});

// POST /api/feedback/:id/escalate  (admin only)
router.post('/:id/escalate', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid feedback id' });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { status: 'escalated', priority: 'high' },
      { new: true, runValidators: true }
    );
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ message: err.message ?? 'Invalid request' });
  }
});

// PATCH /api/feedback/:id
router.patch('/:id', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid feedback id' });
    }

    const update = { ...req.body };

    // Convenience timestamps if status changes
    if (typeof update.status === 'string') {
      if (update.status === 'resolved') update.resolvedAt = new Date();
      if (update.status === 'pending') update.resolvedAt = null;
    }
    if (typeof update.response === 'string' && update.response.trim()) {
      update.respondedAt = new Date();
    }

    const feedback = await Feedback.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (err) {
    res.status(400).json({ message: err.message ?? 'Invalid request' });
  }
});

// DELETE /api/feedback/:id
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid feedback id' });
    }

    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message ?? 'Server error' });
  }
});

module.exports = router;

