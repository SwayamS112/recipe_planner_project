// backend/routes/items.js
const express = require('express');
const router = express.Router();
const ItemList = require('../models/ItemList');
const auth = require('../middleware/auth'); // must set req.userId and req.user
const mongoose = require('mongoose');

// Create a new list
router.post('/', auth, async (req, res) => {
  try {
    const { title, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Provide at least one item' });
    }

    const normalized = items.map(it => ({
      name: String(it.name || '').trim(),
      qty: String(it.qty || '').trim(),
      unit: String(it.unit || '').trim(),
      obtained: !!it.obtained
    }));

    const list = await ItemList.create({
      user: req.userId,
      title: title || 'Shopping List',
      items: normalized
    });

    res.status(201).json(list);
  } catch (err) {
    console.error('create list error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all lists for current user
router.get('/', auth, async (req, res) => {
  try {
    const lists = await ItemList.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(lists);
  } catch (err) {
    console.error('get lists error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single list
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const list = await ItemList.findById(id);
    if (!list) return res.status(404).json({ error: 'Not found' });
    if (String(list.user) !== String(req.userId) && !(req.user && (req.user.role === 'admin' || req.user.role === 'superadmin'))) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    res.json(list);
  } catch (err) {
    console.error('get list error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update list title or entire items array
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, items } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const list = await ItemList.findById(id);
    if (!list) return res.status(404).json({ error: 'Not found' });
    if (String(list.user) !== String(req.userId) && !(req.user && (req.user.role === 'admin' || req.user.role === 'superadmin'))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (typeof title !== 'undefined') list.title = title;
    if (Array.isArray(items)) {
      // replace items array
      list.items = items.map(it => ({
        name: String(it.name || '').trim(),
        qty: String(it.qty || '').trim(),
        unit: String(it.unit || '').trim(),
        obtained: !!it.obtained
      }));
    }

    await list.save();
    res.json(list);
  } catch (err) {
    console.error('update list error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a single item (name/qty/unit/obtained)
router.patch('/:listId/item/:itemIndex', auth, async (req, res) => {
  try {
    const { listId, itemIndex } = req.params;
    const { name, qty, unit, obtained } = req.body;
    if (!mongoose.Types.ObjectId.isValid(listId)) return res.status(400).json({ error: 'Invalid list id' });

    const list = await ItemList.findById(listId);
    if (!list) return res.status(404).json({ error: 'List not found' });
    if (String(list.user) !== String(req.userId) && !(req.user && (req.user.role === 'admin' || req.user.role === 'superadmin'))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const idx = Number(itemIndex);
    if (isNaN(idx) || idx < 0 || idx >= list.items.length) return res.status(400).json({ error: 'Invalid item index' });

    if (typeof name !== 'undefined') list.items[idx].name = String(name).trim();
    if (typeof qty !== 'undefined') list.items[idx].qty = String(qty).trim();
    if (typeof unit !== 'undefined') list.items[idx].unit = String(unit).trim();
    if (typeof obtained !== 'undefined') list.items[idx].obtained = !!obtained;

    await list.save();
    res.json({ ok: true, item: list.items[idx], list });
  } catch (err) {
    console.error('patch item error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a single item from list
router.delete('/:listId/item/:itemIndex', auth, async (req, res) => {
  try {
    const { listId, itemIndex } = req.params;
    if (!mongoose.Types.ObjectId.isValid(listId)) return res.status(400).json({ error: 'Invalid list id' });

    const list = await ItemList.findById(listId);
    if (!list) return res.status(404).json({ error: 'List not found' });
    if (String(list.user) !== String(req.userId) && !(req.user && (req.user.role === 'admin' || req.user.role === 'superadmin'))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const idx = Number(itemIndex);
    if (isNaN(idx) || idx < 0 || idx >= list.items.length) return res.status(400).json({ error: 'Invalid item index' });

    list.items.splice(idx, 1);
    await list.save();
    res.json({ ok: true, list });
  } catch (err) {
    console.error('delete item error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle single item obtained/unobtained (convenience)
router.patch('/:listId/item/:itemIndex/toggle', auth, async (req, res) => {
  try {
    const { listId, itemIndex } = req.params;
    if (!mongoose.Types.ObjectId.isValid(listId)) return res.status(400).json({ error: 'Invalid list id' });

    const list = await ItemList.findById(listId);
    if (!list) return res.status(404).json({ error: 'List not found' });
    if (String(list.user) !== String(req.userId) && !(req.user && (req.user.role === 'admin' || req.user.role === 'superadmin'))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const idx = Number(itemIndex);
    if (isNaN(idx) || idx < 0 || idx >= list.items.length) return res.status(400).json({ error: 'Invalid item index' });

    list.items[idx].obtained = !list.items[idx].obtained;
    await list.save();
    res.json({ ok: true, item: list.items[idx], list });
  } catch (err) {
    console.error('toggle item error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark entire list as done / undone
router.patch('/:id/done', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { done } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const list = await ItemList.findById(id);
    if (!list) return res.status(404).json({ error: 'Not found' });
    if (String(list.user) !== String(req.userId) && !(req.user && (req.user.role === 'admin' || req.user.role === 'superadmin'))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    list.isDone = !!done;
    await list.save();
    res.json({ ok: true, list });
  } catch (err) {
    console.error('mark done error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a list (owner or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' });

    const list = await ItemList.findById(id);
    if (!list) return res.status(404).json({ error: 'Not found' });

    if (String(list.user) !== String(req.userId) && !(req.user && (req.user.role === 'admin' || req.user.role === 'superadmin'))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await list.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error('delete list error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
