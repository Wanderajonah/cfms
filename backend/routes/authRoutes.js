const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadAvatarMiddleware } = require('../middleware/upload');
const { login, register, me, users, updateProfile } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', requireAuth, me);
router.get('/users', requireAuth, requireRole('admin'), users);
router.patch('/profile', requireAuth, uploadAvatarMiddleware, updateProfile);

module.exports = router;
