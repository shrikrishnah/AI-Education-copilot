const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
// This mounts the router at /api. 
// So 'router.post('/upload')' becomes 'POST /api/upload'
app.use('/api', apiRoutes);

// Root Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'Server healthy', timestamp: new Date().toISOString() });
});

module.exports = app;