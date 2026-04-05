const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MANUAL CORS MIDDLEWARE - Place this BEFORE any routes
app.use((req, res, next) => {
  // Allow any origin for testing
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sarroz POS API is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use('/api/auth', require('./routes/authRoutes'));

// Permission routes
app.use('/api/permissions', require('./routes/permissionRoutes'));

// Branch routes
app.use('/api/branches', require('./routes/branchRoutes'));

// Category routes
app.use('/api/categories', require('./routes/categoryRoutes'));

// Product routes
app.use('/api/products', require('./routes/productRoutes'));

// Settings routes
app.use('/api/settings', require('./routes/settingsRoutes'));

// Sale routes (POS)
app.use('/api/sales', require('./routes/saleRoutes'));

// Order routes (WhatsApp orders)
app.use('/api/orders', require('./routes/orderRoutes'));

// Receipt routes
app.use('/api/receipts', require('./routes/receiptRoutes'));

// M-PESA ROUTES
const mpesaRoutes = require('./routes/mpesaRoutes');
app.use('/api/v1/mpesa', mpesaRoutes);

// Report routes
app.use('/api/reports', require('./routes/reportRoutes'));

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;