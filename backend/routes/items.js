const express = require('express');
const router = express.Router();
const ItemList = require('../models/ItemList');
const auth = require('../middleware/auth');

// create or update user's item list
router.post('/', auth, async (req,res)=>{
  try{
    const {items} = req.body; // expect array of {name, quantity, bought}
    let doc = await ItemList.findOne({user:req.userId});
    if(!doc){
      doc = new ItemList({user:req.userId, items});
    }else{
      doc.items = items;
    }
    await doc.save();
    res.json({ok:true, doc});
  }catch(e){ res.status(400).json({error:e.message}); }
});

router.get('/', auth, async (req,res)=>{
  const doc = await ItemList.findOne({user:req.userId});
  res.json(doc || {items:[]});
});

module.exports = router;
