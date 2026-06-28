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
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'https://homelyserv-nznn.vercel.app', 'https://gas-clapped-copper.ngrok-free.dev'],
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: ['http://localhost:5173', 'https://homelyserv-nznn.vercel.app', 'https://gas-clapped-copper.ngrok-free.dev'],
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
server.listen(PORT, () => {
  console.log(`HomelyServ server running on port ${PORT}`);
});