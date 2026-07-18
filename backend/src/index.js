// backend/src/index.js
// ============================================================
// LOAD CONFIGURATION & ENVIRONMENT
// ============================================================
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

// Route Imports Grouped Safely
import authRoutes from './routes/auth.js';
import workerRoutes from './routes/workers.js';
import hireRoutes from './routes/hires.js';
import employerRoutes from './routes/employer.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';
import chatRoutes from './routes/chat.js';
import notificationRoutes from './routes/notifications.js';

import './config.js'; // Running your base configuration routines

// Get the directory where index.js is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root directory (one level up from src)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ============================================================
// UNIFIED INTEGRATION GATEWAY CONNECTIONS DIAGNOSTIC
// ============================================================
console.log('\n--- 🔌 GATEWAY CONNECTIONS ---');

// Paymob Diagnostics
if (process.env.PAYMOB_API_KEY && process.env.PAYMOB_INTEGRATION_ID) {
  console.log(`💳 Paymob Gateway:   ✅ ACTIVE (Integration ID: ${process.env.PAYMOB_INTEGRATION_ID})`);
} else {
  console.log('💳 Paymob Gateway:   ❌ MISSING OR INCOMPLETE KEYS');
}

// PayPal Diagnostics
if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET) {
  console.log(`💰 PayPal Gateway:   ✅ ACTIVE (Mode: ${process.env.PAYPAL_MODE || 'sandbox'})`);
} else {
  console.log('💰 PayPal Gateway:   ❌ MISSING OR INCOMPLETE KEYS');
}

console.log('-------------------------------\n');

// Rest of your file stays completely identical from here down...
const app = express();
const server = http.createServer(app);
// ...

// ============================================================
// CORS Configuration
// ============================================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://homelyserv-nznn.vercel.app',
  'https://gas-clapped-copper.ngrok-free.dev',
  'http://192.168.100.12:5173',
  'http://192.168.100.12:3000',
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d{4,5}$/
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// ============================================================
// MongoDB Connection
// ============================================================
// Using process.env.DATABASE_URL to align with your Prisma Atlas setup
const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/homelyserv';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log(`📁 Database: ${mongoose.connection.db.databaseName}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ============================================================
// Routes
// ============================================================
// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'HomelyServ API is running',
    mongoDB: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// ============================================================
// DEBUG: SHOW ALL USERS
// ============================================================
app.get('/api/debug/all-users', async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const users = await User.find({});
    
    console.log(`🔍 Found ${users.length} users in database`);
    users.forEach(u => console.log(`- ${u.email}`));
    
    res.json({
      success: true,
      count: users.length,
      users: users.map(u => ({
        id: u._id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================================
// DEBUG: CHECK USER COUNT
// ============================================================
app.get('/api/debug/user-count', async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const count = await User.countDocuments();
    const allUsers = await User.find({}).select('email fullName role createdAt');
    
    res.json({
      success: true,
      totalUsers: count,
      users: allUsers
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================================
// DEBUG: FIX USER LISTING
// ============================================================
app.get('/api/users/all', async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log(`📊 API: Found ${users.length} users (no filters)`);
    
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Error in /api/users/all:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'HomelyServ API is running!' });
});

// CORS headers fallback middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// ============================================================
// API Routes Mount point
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/hires', hireRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
// ============================================================
// Socket.IO Configuration
// ============================================================
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`📥 User ${socket.id} joined room: ${roomId}`);
  });
  
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`📤 User ${socket.id} left room: ${roomId}`);
  });
  
  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', data);
    console.log(`💬 Message sent to room ${data.roomId}:`, data.message);
  });
  
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user_typing', { 
      userId: data.userId, 
      isTyping: data.isTyping 
    });
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// ============================================================
// 404 Handler
// ============================================================
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// ============================================================
// Error Handler
// ============================================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================
// Start Server
// ============================================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HomelyServ server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
});