const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function serializeUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    role: user.role,
    name: user.name ?? null,
    avatarUrl: user.avatarUrl ?? null,
  };
}

const avatarDir = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const safe = allowed.includes(ext) ? ext : '.jpg';
    cb(null, `${req.user.id}-${Date.now()}${safe}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

function signToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(user._id),
    role: user.role,
    iat: now,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || user.isActive === false) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await user.verifyPassword(String(password));
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.json({
      token,
      user: serializeUser(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message ?? 'Server error' });
  }
});

// POST /api/auth/register
// Bootstrapping rule:
// - If there are no users yet, anyone can register as admin.
// - Otherwise, only admins can create users (staff/admin).
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const existingCount = await User.countDocuments({});
    const requestedRole = String(role || 'staff');

    if (existingCount > 0) {
      // Requires admin token
      const tokenHeader = req.headers.authorization;
      if (!tokenHeader) return res.status(401).json({ message: 'Unauthorized' });
      // Reuse middleware by running it inline
      // eslint-disable-next-line no-use-before-define
      return requireAuth(req, res, () =>
        requireRole('admin')(req, res, async () => {
          const created = await createUser({ email, password, name, role: requestedRole });
          res.status(201).json(serializeUser(created));
        })
      );
    }

    const firstRole = requestedRole === 'staff' ? 'staff' : 'admin';
    const created = await createUser({ email, password, name, role: firstRole });
    const token = signToken(created);
    res.status(201).json({
      token,
      user: serializeUser(created),
    });
  } catch (err) {
    res.status(400).json({ message: err.message ?? 'Invalid request' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/users?role=staff
router.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const role = req.query.role ? String(req.query.role) : '';
    const filter = {};
    if (role) filter.role = role === 'admin' ? 'admin' : 'staff';
    const users = await User.find(filter).sort({ name: 1, email: 1 }).lean();
    res.json({ items: users.map(serializeUser) });
  } catch (err) {
    res.status(500).json({ message: err.message ?? 'Server error' });
  }
});

// PATCH /api/auth/profile — multipart: name, avatar (file), optional currentPassword + newPassword
router.patch('/profile', requireAuth, (req, res, next) => {
  uploadAvatar.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Upload failed' });
    next();
  });
}, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name !== undefined) {
      const n = String(req.body.name || '').trim();
      user.name = n || undefined;
    }

    if (req.file) {
      const rel = `/uploads/avatars/${req.file.filename}`;
      if (user.avatarUrl && user.avatarUrl.startsWith('/uploads/avatars/')) {
        const oldPath = path.join(__dirname, '..', user.avatarUrl.replace(/^\//, ''));
        fs.unlink(oldPath, () => {});
      }
      user.avatarUrl = rel;
    }

    const newPassword = req.body.newPassword ? String(req.body.newPassword) : '';
    if (newPassword) {
      const currentPassword = req.body.currentPassword ? String(req.body.currentPassword) : '';
      if (!currentPassword) return res.status(400).json({ message: 'Current password is required to set a new password' });
      const ok = await user.verifyPassword(currentPassword);
      if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
      user.passwordHash = await User.hashPassword(newPassword);
    }

    await user.save();
    res.json({ user: serializeUser(user) });
  } catch (err) {
    res.status(400).json({ message: err.message ?? 'Update failed' });
  }
});

async function createUser({ email, password, name, role }) {
  const normalizedEmail = String(email).toLowerCase().trim();
  const passwordHash = await User.hashPassword(String(password));
  const user = await User.create({
    email: normalizedEmail,
    name: name ? String(name) : undefined,
    role: role === 'admin' ? 'admin' : 'staff',
    passwordHash,
  });
  return user;
}

module.exports = router;

