import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
<<<<<<< HEAD
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load environment variables
=======
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
<<<<<<< HEAD
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', process.env.BASE_URL],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Test database connection
app.get('/api/db-test', async (req, res) => {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    res.json({ 
      success: true, 
      message: 'Database connected!',
      userCount 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: error.message 
=======

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, role, phone, city } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user (temporarily without database)
    const user = {
      id: Date.now(),
      email,
      password: hashedPassword,
      fullName,
      role: role || 'worker',
      phone: phone || '',
      city: city || '',
      createdAt: new Date().toISOString()
    };
    
    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
    });
  }
});

<<<<<<< HEAD
// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, phone, city, role } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        phone,
        city,
        role: role || 'worker'
      }
    });
    
    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed',
      error: error.message 
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed',
      error: error.message 
    });
  }
});

// Verify token
app.get('/api/auth/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ valid: false, message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    
    if (!user) {
      return res.status(401).json({ valid: false, message: 'User not found' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      valid: true,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(401).json({ 
      valid: false, 
      message: 'Invalid token',
      error: error.message 
    });
  }
});

// ==================== WORKER ROUTES ====================

// Get all workers
app.get('/api/workers', async (req, res) => {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'worker' },
      include: {
        workerProfile: true
      }
    });
    
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get worker by ID
app.get('/api/workers/:id', async (req, res) => {
  try {
    const worker = await prisma.user.findUnique({
      where: { 
        id: req.params.id,
        role: 'worker'
      },
      include: {
        workerProfile: {
          include: {
            experiences: true,
            documents: true,
            reviews: true
          }
        }
      }
    });
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    res.json(worker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search workers
app.get('/api/workers/search', async (req, res) => {
  try {
    const { q, category, location, minSalary, maxSalary, minRating } = req.query;
    
    const workers = await prisma.user.findMany({
      where: {
        role: 'worker',
        ...(q && {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } }
          ]
        }),
        ...(category && {
          workerProfile: {
            category: category
          }
        }),
        ...(location && {
          city: { contains: location, mode: 'insensitive' }
        })
      },
      include: {
        workerProfile: true
      }
    });
    
    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DEFAULT ROUTE ====================

=======
// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Temporary hardcoded user for testing
    if (email === 'worker@homelyserv.com' && password === 'password123') {
      const token = jwt.sign(
        { id: 1, email: email, role: 'worker' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: 1,
          email: email,
          fullName: 'tester',
          role: 'worker'
        },
        token
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
app.get('/', (req, res) => {
  res.json({ 
    message: 'HomelyServ API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/db-test',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/verify',
      'GET /api/workers',
      'GET /api/workers/:id',
      'GET /api/workers/search'
    ]
  });
});

<<<<<<< HEAD
// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==================== SOCKET.IO ====================

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', process.env.BASE_URL],
    methods: ['GET', 'POST'],
    credentials: true
  },
});

io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
  
  socket.on('message', (data) => {
    console.log('📩 Message received:', data);
    io.emit('message', data);
  });
});

// ==================== START SERVER ====================

server.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 HomelyServ Backend Server');
  console.log('========================================');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌐 Public URL: ${process.env.BASE_URL || 'Not set'}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️ Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log('========================================');
  console.log('✅ Server is ready to accept requests');
  console.log('========================================');
=======
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
});