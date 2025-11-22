// routes/admin.js
const express = require('express');
const router = express.Router();
const { default: mongoose } = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post'); 

// middleware to require specific roles
const requireRole = (roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role || !roles.includes(role)) return res.status(403).json({ error: 'Forbidden' });
  next();
};

// Require admin for all routes
router.use(auth);
router.use(requireRole(["admin", "superadmin"]));

// GET all users (with simple filters)
router.get("/users", async (req, res) => {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
  res.json(users);
});

// Block / Unblock user (admin or superadmin)
// Note: prevent admins from blocking superadmin
router.patch('/users/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const { block } = req.body; // true/false
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid user id' });
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role === 'superadmin') return res.status(403).json({ error: 'Cannot block superadmin' });

    target.isBlocked = !!block;
    // optional: bump tokenVersion so existing tokens are invalidated
    if (block) target.tokenVersion = (target.tokenVersion || 0) + 1;
    await target.save();
    res.json({ ok: true, user: { id: target._id, isBlocked: target.isBlocked }});
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Promote / demote role - only superadmin allowed to change roles
router.patch('/users/:id/role', requireRole(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // 'user' or 'admin' (do NOT allow promoting to superadmin casually)
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (String(target._id) === String(req.userId)) return res.status(400).json({ error: 'Cannot change own role' });

    target.role = role;
    // bump tokenVersion so tokens reflect new role requirement
    target.tokenVersion = (target.tokenVersion || 0) + 1;
    await target.save();
    res.json({ ok: true, user: { id: target._id, role: target.role }});
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Posts moderation example (soft remove)
router.get('/posts', async (req, res) => {
  const posts = await Post.find().populate('author', 'name email').sort({ createdAt: -1 });
  res.json(posts);
});

// Remove post (soft delete) or restore
router.patch('/posts/:id/remove', async (req, res) => {
  try {
    const { id } = req.params;
    const { remove } = req.body;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.isRemoved = !!remove;
    post.removedBy = remove ? req.userId : undefined;
    await post.save();
    res.json({ ok: true, post: { id: post._id, isRemoved: post.isRemoved }});
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// permanent delete - superadmin only
router.delete('/posts/:id', requireRole(['superadmin']), async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
