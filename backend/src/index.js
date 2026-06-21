const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'HomelyServ API is running!' });
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const workerRoutes = require('./routes/workers');
app.use('/api/workers', workerRoutes);

const hireRoutes = require('./routes/hires');
app.use('/api/hires', hireRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`HomelyServ server running on port ${PORT}`);
});

module.exports = app;