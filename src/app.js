const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(expreimport axios from "axios";

// Use environment variable or default to Render backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://sarroz-backend.onrender.com";

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor to add auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);ss.urlencoded({ extended: true }));

// Enable CORS - Allow multiple origins
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'https://sarroz-connect-lpcw.vercel.app',
  'https://sarroz-connect.vercel.app'  // Add your production Vercel URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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