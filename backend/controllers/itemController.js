// controllers/itemController.js
const ItemList = require('../models/ItemList');

// Save / Update Item List
exports.saveItemList = async (req, res) => {
  try {
    const { items } = req.body; // expect array of {name, quantity, bought}

    let doc = await ItemList.findOne({ user: req.userId });

    if (!doc) {
      doc = new ItemList({
        user: req.userId,
        items
      });
    } else {
      doc.items = items;
    }

    await doc.save();
    res.json({ ok: true, data: doc });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get Item List
exports.getItemList = async (req, res) => {
  try {
    const doc = await ItemList.findOne({ user: req.userId });
    res.json(doc || { items: [] });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
