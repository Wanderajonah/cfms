const express = require('express');
const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Admin-only contacts directory
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { isActive: true };
    if (search && String(search).trim()) {
      filter.$text = { $search: String(search).trim() };
    }
    const items = await Contact.find(filter).sort('name').limit(200).lean();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message ?? 'Server error' });
  }
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { name, phone, email, notes } = req.body ?? {};
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required' });
    const created = await Contact.create({ name, phone, email, notes });
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: err.message ?? 'Invalid request' });
  }
});

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid contact id' });
    const updated = await Contact.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Contact not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message ?? 'Server error' });
  }
});

module.exports = router;

