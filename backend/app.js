// backend/app.js
require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const adminRoutes = require('./routes/admin');
const bootstrapAdmin = require('./utils/bootstrapAdmin');

const authRouter = require('./routes/auth');
const recipesRouter = require('./routes/recipes');
const itemsRouter = require('./routes/items');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/items', itemsRouter);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Recipe Planner API is running');
});

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection failed:', err));

bootstrapAdmin().catch(err => console.error('bootstrap error', err));
