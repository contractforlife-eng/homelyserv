// backend/src/index.js
// ============================================================
// LOAD .env - SIMPLEST WAY
// ============================================================
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import './config.js';
// Get the directory where index.js is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root directory (one level up from src)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ============================================================
// Debug - Check if .env loaded
// ============================================================
console.log('📂 .env loaded from:', path.join(__dirname, '..', '.env'));
console.log('🔑 PAYMOB_API_KEY:', process.env.PAYMOB_API_KEY ? '✅ Found' : '❌ Missing');
console.log('🔑 PAYMOB_INTEGRATION_ID:', process.env.PAYMOB_INTEGRATION_ID ? '✅ Found' : '❌ Missing');
console.log('🔑 PAYMOB_IFRAME_ID:', process.env.PAYMOB_IFRAME_ID ? '✅ Found' : '❌ Missing');

// ============================================================
// NOW LOAD OTHER IMPORTS
// ============================================================
import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import workerRoutes from './routes/workers.js';
import hireRoutes from './routes/hires.js';
import employerRoutes from './routes/employer.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';
import chatRoutes from './routes/chat.js'

const app = express();
const server = http.createServer(app);

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
// IMPORTANT: There is intentionally NO localhost fallback here.
// A silent fallback to `mongodb://localhost:27017/homelyserv` is what caused
// users to "disappear day by day": whenever MONGODB_URI was unset the server
// quietly wrote data to an ephemeral local database that got wiped on every
// machine restart / tunnel rotation. We now REQUIRE a managed connection
// string (MongoDB Atlas) and fail loudly instead of losing data.
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ FATAL: MONGODB_URI is not set.');
  console.error('   Set it to your MongoDB Atlas connection string, e.g.:');
  console.error('   MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/homelyserv?retryWrites=true&w=majority"');
  process.exit(1);
}

// Guard against accidentally pointing production at an ephemeral local DB.
if (/localhost|127\.0\.0\.1/.test(MONGODB_URI) && process.env.NODE_ENV === 'production') {
  console.error('❌ FATAL: MONGODB_URI points at localhost while NODE_ENV=production.');
  console.error('   Local MongoDB is ephemeral and will lose your users. Use a managed');
  console.error('   MongoDB Atlas cluster instead.');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  // Keep the pool healthy on serverless / long-running hosts.
  maxPoolSize: 10,
  retryWrites: true,
})
  .then(() => {
    const host = mongoose.connection.host;
    console.log('✅ MongoDB connected successfully');
    console.log(`📁 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🌐 Host: ${host}`);
    if (/localhost|127\.0\.0\.1/.test(host || '')) {
      console.warn('⚠️  WARNING: Connected to a LOCAL MongoDB. Data here is NOT durable and');
      console.warn('   will be lost on restart. Point MONGODB_URI at MongoDB Atlas.');
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Surface connection drops instead of failing silently.
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Mongoose will attempt to reconnect.');
});
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected.');
});
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB runtime error:', err.message);
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

app.get('/', (req, res) => {
  res.json({ message: 'HomelyServ API is running!' });
});

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// ============================================================
// API Routes
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/hires', hireRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
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
  console.log(`\n🚀 HomelyServ server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
});
