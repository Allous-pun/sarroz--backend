const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ✅ FIXED CORS CONFIG
const allowedOrigins = [
  "http://localhost:8080",
  "http://192.168.1.8:8080",
  "https://sarroz-connect-lpcw.vercel.app" // ❗ removed trailing slash
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Postman / mobile

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS not allowed: " + origin));
  },
  credentials: true,
}));

// ❌ REMOVE THIS (causes crash)
// app.options('*', cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sarroz POS API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/permissions', require('./routes/permissionRoutes'));
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes'));

const mpesaRoutes = require('./routes/mpesaRoutes');
app.use('/api/v1/mpesa', mpesaRoutes);

app.use('/api/reports', require('./routes/reportRoutes'));

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ✅ ERROR HANDLER WITH CORS
app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;