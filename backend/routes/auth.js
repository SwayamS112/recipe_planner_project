// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { hashPassword } = require('../utils/hash');
const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const auth = require('../middleware/auth');

// SIGNUP
router.post('/signup', upload.single('avatar'), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    let avatarUrl = null;
    if (req.file) {
      avatarUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'recipe-users' }, (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        });
        stream.end(req.file.buffer);
      });
    }

    const { salt, hash } = hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash: hash,
      salt,
      avatar: avatarUrl,
      phone: null,
      role: 'user' // explicitly set default role
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, phone: user.phone, role: user.role }
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    if (user.isBlocked) return res.status(403).json({ error: 'Account blocked' });

    const { hash } = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, tokenVersion: user.tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, phone: user.phone, role: user.role }
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});
// GET current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash -salt');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

// UPDATE profile (name, email, phone, avatar)
router.put('/me', auth, upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, email, phone } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;

    // phone: expect optional numeric string or number; enforce 10-digit if provided
    if (typeof phone !== 'undefined' && phone !== null && phone !== '') {
      const phoneStr = String(phone).replace(/\D/g, '');
      if (phoneStr.length !== 10) return res.status(400).json({ error: 'Phone must be 10 digits' });
      user.phone = Number(phoneStr);
    } else {
      user.phone = null;
    }

    if (req.file) {
      const avatarUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: 'recipe-users' }, (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        });
        stream.end(req.file.buffer);
      });
      user.avatar = avatarUrl;
    }

    await user.save();
    res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, phone: user.phone } });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

// CHANGE PASSWORD
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { hash: currentHash } = hashPassword(currentPassword, user.salt);
    if (currentHash !== user.passwordHash) return res.status(400).json({ error: 'Current password is incorrect' });

    const { salt, hash } = hashPassword(newPassword);
    user.salt = salt;
    user.passwordHash = hash;
    await user.save();

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
