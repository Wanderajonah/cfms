const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

function serializeUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    role: user.role,
    name: user.name ?? null,
    avatarUrl: user.avatarUrl ?? null,
  };
}

function signToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(user._id),
    role: user.role,
    iat: now,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

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

async function login(req, res) {
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
}

async function register(req, res) {
  try {
    const { email, password, name, role } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const existingCount = await User.countDocuments({});
    const requestedRole = String(role || 'staff');

    if (existingCount > 0) {
      // Verify token and admin role manually
      const header = req.headers.authorization || '';
      const [type, token] = header.split(' ');
      if (type !== 'Bearer' || !token) return res.status(401).json({ message: 'Unauthorized' });

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

      const created = await createUser({ email, password, name, role: requestedRole });
      return res.status(201).json(serializeUser(created));
    }

    const firstRole = requestedRole === 'staff' ? 'staff' : 'admin';
    const created = await createUser({ email, password, name, role: firstRole });
    const token = signToken(created);
    res.status(201).json({ token, user: serializeUser(created) });
  } catch (err) {
    res.status(400).json({ message: err.message ?? 'Invalid request' });
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

async function users(req, res) {
  try {
    const role = req.query.role ? String(req.query.role) : '';
    const filter = {};
    if (role) filter.role = role === 'admin' ? 'admin' : 'staff';
    const allUsers = await User.find(filter).sort({ name: 1, email: 1 }).lean();
    res.json({ items: allUsers.map(serializeUser) });
  } catch (err) {
    res.status(500).json({ message: err.message ?? 'Server error' });
  }
}

async function updateProfile(req, res) {
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
        const oldPath = path.join(__dirname, '..', 'uploads', 'avatars', path.basename(user.avatarUrl));
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
}

module.exports = { login, register, me, users, updateProfile };
