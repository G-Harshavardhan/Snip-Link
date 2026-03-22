require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const urlRoutes = require('./routes/urls');
const redirectRoute = require('./routes/redirect');

const app = express();
const PORT = process.env.PORT || 5001;

// 1. CORS - Absolute Priority (Must be before routes)
app.use(cors({
  origin: true,
  credentials: true
}));
app.options('*', cors());

// Create HTTP server for WebSockets (using the same CORS logic)
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configure socket.io connections globally
io.on('connection', (socket) => {
  socket.on('joinRoom', (userId) => {
    socket.join(`user_${userId}`);
  });
});

// Mount socket globally
app.set('io', io);

// 2. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

// 3. Other Middleware
app.use(express.json());
app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);

// Redirect route
app.use('/', redirectRoute);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 SnipLink Server running on port ${PORT}`);
});
