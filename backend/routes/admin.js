// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth'); // auth middleware that sets req.user & req.userId
const requireRole = require('../middleware/roles'); // role helper (only import once)
const User = require('../models/User');
const Recipe = require('../models/Recipe'); // posts model

// protect all admin routes (admin + superadmin can access)
router.use(auth);
router.use(requireRole(['admin', 'superadmin']));

// list users (safe)
router.get('/users', async (req, res) => {
  const users = await User.find().select('-passwordHash -salt').sort({ createdAt: -1 });
  res.json(users);
});

// block/unblock user (admin or superadmin). Admin cannot block superadmin.
router.patch('/users/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const { block } = req.body; // true/false
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const target = await User.findById(id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (target.role === 'superadmin') return res.status(403).json({ error: 'Cannot block superadmin' });

    target.isBlocked = !!block;
    if (block) target.tokenVersion = (target.tokenVersion || 0) + 1; // invalidate tokens
    await target.save();

    return res.json({ ok: true, user: { id: target._id, isBlocked: target.isBlocked } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// promote/demote role - ONLY superadmin allowed to change roles
router.patch('/users/:id/role', requireRole(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // 'user' | 'admin'
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const target = await User.findById(id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    if (String(target._id) === String(req.userId)) return res.status(400).json({ error: 'Cannot change own role' });

    target.role = role;
    target.tokenVersion = (target.tokenVersion || 0) + 1; // require re-login so token reflects new role
    await target.save();

    res.json({ ok: true, user: { id: target._id, role: target.role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/* POSTS moderation */
router.get('/posts', async (req, res) => {
  try {
    // fetch raw posts
    const posts = await Recipe.find().lean().sort({ createdAt: -1 });

    // Detect which field stores user reference
    const hasUserRef = Recipe.schema.path("user");
    const hasAuthorRef = Recipe.schema.path("author");

    if (hasUserRef || hasAuthorRef) {
      const refField = hasUserRef ? "user" : "author";
      const ids = posts.map(p => p[refField]).filter(Boolean).map(String);

      let users = [];
      if (ids.length > 0) {
        users = await User.find({ _id: { $in: ids } })
          .select("name email avatar")
          .lean();
      }

      const userMap = {};
      users.forEach(u => (userMap[String(u._id)] = u));

      const out = posts.map(p => ({
        ...p,
        user: userMap[String(p[refField])] || { name: "Unknown", email: "", avatar: "" }
      }));

      return res.json(out);
    }

    // If schema has NO user reference field
    const out = posts.map(p => ({
      ...p,
      user: p.user || { name: "Unknown", email: "", avatar: "" }
    }));

    return res.json(out);

  } catch (err) {
    console.error("Admin posts load error:", err);
    res.status(500).json({ error: "Could not load posts" });
  }
});


// soft remove/restore (admin or superadmin)
router.patch('/posts/:id/remove', async (req, res) => {
  try {
    const { id } = req.params;
    const { remove } = req.body;
    const post = await Recipe.findById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.isRemoved = !!remove;
    post.removedBy = remove ? req.userId : undefined;
    await post.save();
    res.json({ ok: true, post: { id: post._id, isRemoved: post.isRemoved }});
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// permanent delete (superadmin only)
router.delete('/posts/:id', requireRole(['superadmin']), async (req, res) => {
  try {
    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
