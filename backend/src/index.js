const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'HomelyServ API is running!' });
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const workerRoutes = require('./routes/workers');
app.use('/api/workers', workerRoutes);

const hireRoutes = require('./routes/hires');
app.use('/api/hires', hireRoutes);

// Socket.io for real-time chat
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