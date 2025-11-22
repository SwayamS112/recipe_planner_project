// routes/items.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const {
  saveItemList,
  getItemList
} = require('../controllers/itemController');

router.post('/', auth, saveItemList);
router.get('/', auth, getItemList);

module.exports = router;
