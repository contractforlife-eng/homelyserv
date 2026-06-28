import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import workerRoutes from './routes/workers.js';
import hireRoutes from './routes/hires.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ Add your local IP to CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://homelyserv-nznn.vercel.app',
  'https://gas-clapped-copper.ngrok-free.dev',
  'http://192.168.100.12:5173',  // ✅ Add your IP here
  'http://192.168.100.12:3000',  // ✅ Add your IP here
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d{4,5}$/ // ✅ Allow any device on network
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'HomelyServ API is running'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.get('/', (req, res) => {
  res.json({ message: 'HomelyServ API is running!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/hires', hireRoutes);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });
  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', data);
  });
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {  // ✅ Listen on all network interfaces
  console.log(`HomelyServ server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📍 Network: http://192.168.100.12:${PORT}`);
});