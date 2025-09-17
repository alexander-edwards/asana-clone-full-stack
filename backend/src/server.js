const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspaces');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');

const app = express();
const httpServer = createServer(app);

// Socket.io setup for real-time updates
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Asana Clone Backend'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Teams routes
app.use('/api/teams', require('./routes/teams'));

// Activities routes
app.use('/api/activities', require('./routes/activities'));

// Notifications routes
app.use('/api/notifications', require('./routes/notifications'));

// Search routes
app.use('/api/search', require('./routes/search'));

// Socket.io connection handling
const socketUserMap = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('authenticate', (userId) => {
    socketUserMap.set(socket.id, userId);
    socket.join(`user:${userId}`);
    console.log(`User ${userId} authenticated on socket ${socket.id}`);
  });

  socket.on('join-workspace', (workspaceId) => {
    socket.join(`workspace:${workspaceId}`);
    console.log(`Socket ${socket.id} joined workspace ${workspaceId}`);
  });

  socket.on('join-project', (projectId) => {
    socket.join(`project:${projectId}`);
    console.log(`Socket ${socket.id} joined project ${projectId}`);
  });

  socket.on('leave-project', (projectId) => {
    socket.leave(`project:${projectId}`);
    console.log(`Socket ${socket.id} left project ${projectId}`);
  });

  socket.on('task-update', (data) => {
    // Broadcast task updates to all users in the project
    socket.to(`project:${data.projectId}`).emit('task-updated', data);
  });

  socket.on('comment-added', (data) => {
    // Broadcast new comments to all users in the project
    socket.to(`project:${data.projectId}`).emit('new-comment', data);
  });

  socket.on('typing', (data) => {
    // Broadcast typing indicator
    socket.to(`project:${data.projectId}`).emit('user-typing', {
      userId: socketUserMap.get(socket.id),
      taskId: data.taskId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    socketUserMap.delete(socket.id);
    console.log('Client disconnected:', socket.id);
  });
});

// Export io for use in routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Asana Clone Backend Server is running on port ${PORT}`);
  console.log(`📡 WebSocket server is ready for real-time updates`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = { app, io };
