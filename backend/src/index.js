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
import workerPayoutRoutes from './routes/workerPayout.js';
import workerPremiumRoutes from './routes/workerPremium.js';
import workerEarningsRoutes from './routes/workerEarnings.js';
import workerPaymentHistoryRoutes from './routes/workerPaymentHistory.js';
import employerEarningsRoutes from './routes/employerEarnings.js';
import hireRoutes from './routes/hires.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import employerRoutes from './routes/employer.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';
import commissionRoutes from './routes/commission.js';
import chatRoutes from './routes/chat.js';
import userBlockRoutes from './routes/userBlocks.js';
import notificationRoutes from './routes/notifications.js';
import oauthRoutes from './routes/oauth.js';
import supportRoutes from './routes/support.js';
import supHelpRoutes from './routes/supHelp.js';
import complaintRoutes from './routes/complaints.js';
import sidebarRoutes from './routes/sidebar.js';
import publicSupportRoutes from './routes/publicSupport.js';
import registrationGeographyRoutes from './routes/registrationGeography.js';
import analyticsRoutes from './routes/analytics.js';
import { requireAdmin } from './middleware/auth.js';
import { setIo } from './lib/socket.js';
import { emitToUser } from './lib/socket.js';
import { canAccessConversation } from './routes/chat.js';
import { getBlockRelationship } from './services/userBlockService.js';
import Conversation from './models/Conversation.js';
import { verifyGuestConversation, verifyStaffToken } from './services/publicSupportAccessService.js';
import { startPublicSupportExpiryWorker } from './services/publicSupportExpiryService.js';
import { createSocketAuthMiddleware, joinAuthenticatedUserRoom, joinGenericRoom, privateUserRoom } from './services/socketAuthService.js';
import './config.js'; // Running your base configuration routines
import { initializeFcm } from './services/fcmInit.js';

// Get the directory where index.js is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root directory (one level up from src)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Firebase Admin for FCM (best-effort; missing credentials do not crash startup)
initializeFcm().catch(() => {});

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

const app = express();
const server = http.createServer(app);

// ============================================================
// CORS Configuration - FIXED
// ============================================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'https://localhost',
  'https://homelyserv-nznn.vercel.app',
  'https://gas-clapped-copper.ngrok-free.dev',
  'http://192.168.100.12:5173',
  'http://192.168.100.12:3000',
  'https://homelyserv.com',
  'https://www.homelyserv.com',
];

// Dynamic origin function for CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    // Check for ngrok subdomains
    const isNgrok = /^https:\/\/.*\.ngrok-free\.dev$/.test(origin);
    
    if (isAllowed || isNgrok) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Guest-Token',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Apply CORS middleware FIRST
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Additional CORS headers middleware (fallback)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin) {
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    const isNgrok = /^https:\/\/.*\.ngrok-free\.dev$/.test(origin);
    
    if (isAllowed || isNgrok) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Guest-Token, Accept, Origin');
    }
  }
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// ============================================================
// Framing Protection (Clickjacking)
// Response headers only - do not affect CORS/API behavior.
// ============================================================
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  next();
});

// ============================================================
// Body Parser - After CORS
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// ============================================================
// Socket.IO Configuration
// ============================================================
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return allowed === origin;
      });
      
      const isNgrok = /^https:\/\/.*\.ngrok-free\.dev$/.test(origin);
      
      if (isAllowed || isNgrok) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});
io.use(createSocketAuthMiddleware());

// ============================================================
// MongoDB Connection
// ============================================================
const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/homelyserv';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log(`📁 Database: ${mongoose.connection.db.databaseName}`);
    startPublicSupportExpiryWorker();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
import prisma from "./lib/prisma.js";


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
// PHASE 0 SECURITY FIX (audit §2.9): previously unauthenticated,
// leaked every user's email/fullName/role to anonymous callers.
// Debug endpoints like this should not exist in production at all;
// they are gated behind admin auth here as an interim fix and should
// be removed entirely in a later phase.
// ============================================================
app.get('/api/debug/all-users', requireAdmin, async (req, res) => {
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
// PHASE 0 SECURITY FIX (audit §2.9): previously unauthenticated.
// ============================================================
app.get('/api/debug/user-count', requireAdmin, async (req, res) => {
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
// PHASE 0 SECURITY FIX (audit §2.9): previously unauthenticated.
// ============================================================
app.get('/api/users/all', requireAdmin, async (req, res) => {
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

// ============================================================
// API Routes Mount point
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/worker', workerPayoutRoutes);
app.use('/api/worker', workerPremiumRoutes);
app.use('/api/worker', workerEarningsRoutes);
app.use('/api/worker', workerPaymentHistoryRoutes);
app.use('/api/employer', employerEarningsRoutes);
app.use('/api/hires', hireRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/jobs', applicationRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/admin/registration-geography', registrationGeographyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat', userBlockRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/sup-help', supHelpRoutes);
app.use('/api/sidebar', sidebarRoutes);
app.use('/api/public-support', publicSupportRoutes);
app.use('/api', complaintRoutes);
// ============================================================
// Socket.IO Event Handlers
// ============================================================
// Share the io instance with services (NotificationService, etc.)
setIo(io);

io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  
  joinAuthenticatedUserRoom(socket);

  // PRESENCE-ONLY: track authenticated socket presence (additive, no chat changes)
  const presenceUserId = socket?.user?.userId;
  if (presenceUserId) {
    import('./lib/presence.js').then(({ addPresenceSocket, getAuthorizedObserverIds }) => {
      const becameOnline = addPresenceSocket(presenceUserId, socket.id);
      if (becameOnline) {
        getAuthorizedObserverIds(presenceUserId).then((observerIds) => {
          for (const observerId of observerIds) {
            if (String(observerId) !== String(presenceUserId)) {
              io.to(`user_${observerId}`).emit('presence:update', {
                userId: String(presenceUserId),
                isOnline: true,
              });
            }
          }
        }).catch(() => {});
      }
    });
  }

  socket.on('join_room', (roomId) => {
    // Generic room joining is restricted to authenticated sockets with a
    // server-derived socket.user.userId. Unauthenticated public-support guest
    // sockets cannot use generic join_room; their only room access goes
    // through the dedicated verified public-support:* flow.
    if (joinGenericRoom(socket, roomId)) {
      console.log(`📥 User ${socket.id} joined room: ${roomId}`);
    }
  });

  // Join the user's personal notification room
  socket.on('join_user_room', (_requestedUserId) => {
    const userId = socket.user?.userId;
    if (socket.user?.userId) {
      socket.join(privateUserRoom(socket.user.userId));
      console.log(`🔔 User ${socket.id} joined notification room: user_${userId}`);
    }
  });
  
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`📤 User ${socket.id} left room: ${roomId}`);
  });
  
  // Persisted chat sends are accepted only through authenticated
  // POST /api/chat/send, where the paid Employer/Worker relationship is
  // enforced. Keep the former unauthenticated client relay disabled so it
  // cannot bypass authorization. No active frontend emits this event.
  socket.on('send_message', () => {
    socket.emit('message_error', { error: 'Use the authenticated chat API.' });
  });

  // Public live-support rooms require possession of the conversation's
  // unguessable access token. Staff queue access requires a current JWT and
  // an ADMIN/SUPPORT role. Neither room trusts a role or user id from clients.
  socket.on('public-support:join-guest', async ({ publicId, token } = {}, acknowledge = () => {}) => {
    try {
      const conversation = await verifyGuestConversation(publicId, token);
      if (!conversation) return acknowledge({ ok: false });
      socket.join(`public-support:${conversation.publicId}`);
      acknowledge({ ok: true });
    } catch {
      acknowledge({ ok: false });
    }
  });

  socket.on('public-support:join-staff', async ({ token } = {}, acknowledge = () => {}) => {
    const staff = await verifyStaffToken(token);
    if (!staff) return acknowledge({ ok: false });
    if (staff.role === 'ADMIN') socket.join('public-support:staff:admins');
    else {
      socket.join(`public-support:staff:${staff.userId}`);
      socket.join('public-support:queue');
    }
    acknowledge({ ok: true });
  });
  
  socket.on('typing:start', async ({ conversationId, recipientId }) => {
    const senderId = socket.user?.userId;
    if (!senderId || !conversationId || !recipientId) return;

    try {
      const senderAllowed = await canAccessConversation(conversationId, senderId, socket.user?.role);
      if (!senderAllowed) return;

      const conversation = await Conversation.findOne({ conversationId });
      if (!conversation) {
        const parts = String(conversationId).replace('conv_', '').split('_');
        if (parts.length !== 2) return;
        if (!(parts[0] === String(recipientId) || parts[1] === String(recipientId))) return;
      } else {
        const recipientOk =
          conversation.participantIds.includes(String(recipientId)) ||
          conversation.supportAgentId === String(recipientId) ||
          conversation.staffIds.includes(String(recipientId));
        if (!recipientOk) return;
      }

      const blockRelationship = await getBlockRelationship(senderId, recipientId);
      if (blockRelationship.isCommunicationBlocked) return;

      emitToUser(recipientId, 'typing:update', {
        conversationId: String(conversationId),
        userId: String(senderId),
        isTyping: true
      });
    } catch {
      return;
    }
  });

  socket.on('typing:stop', async ({ conversationId, recipientId }) => {
    const senderId = socket.user?.userId;
    if (!senderId || !conversationId || !recipientId) return;

    try {
      const senderAllowed = await canAccessConversation(conversationId, senderId, socket.user?.role);
      if (!senderAllowed) return;

      const conversation = await Conversation.findOne({ conversationId });
      if (!conversation) {
        const parts = String(conversationId).replace('conv_', '').split('_');
        if (parts.length !== 2) return;
        if (!(parts[0] === String(recipientId) || parts[1] === String(recipientId))) return;
      } else {
        const recipientOk =
          conversation.participantIds.includes(String(recipientId)) ||
          conversation.supportAgentId === String(recipientId) ||
          conversation.staffIds.includes(String(recipientId));
        if (!recipientOk) return;
      }

      const blockRelationship = await getBlockRelationship(senderId, recipientId);
      if (blockRelationship.isCommunicationBlocked) return;

      emitToUser(recipientId, 'typing:update', {
        conversationId: String(conversationId),
        userId: String(senderId),
        isTyping: false
      });
    } catch {
      return;
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);

    // PRESENCE-ONLY: remove socket from presence registry (additive, no chat changes)
    const disconnectUserId = socket?.user?.userId;
    if (disconnectUserId) {
      import('./lib/presence.js').then(({ removePresenceSocket, getAuthorizedObserverIds }) => {
        const becameOffline = removePresenceSocket(disconnectUserId, socket.id);
        if (becameOffline) {
          getAuthorizedObserverIds(disconnectUserId).then((observerIds) => {
            for (const observerId of observerIds) {
              if (String(observerId) !== String(disconnectUserId)) {
                io.to(`user_${observerId}`).emit('presence:update', {
                  userId: String(disconnectUserId),
                  isOnline: false,
                });
              }
            }
          }).catch(() => {});
        }
      });
    }
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

export default app;
