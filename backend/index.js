const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// socket.io connection logic
io.on('connection', (socket) => {
  console.log(`[SOCKET] Un utilisateur est connecté : ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log('[SOCKET] Utilisateur déconnecté');
  });
});

// Rendre 'io' accessible dans toutes les routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100 
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/sales', require('./routes/sales.routes'));
app.use('/api/debts', require('./routes/debts.routes'));
app.use('/api/invoices', require('./routes/invoices.routes'));
app.use('/api/deposits', require('./routes/deposits.routes'));
app.use('/api/expenses', require('./routes/expenses.routes'));
app.use('/api/activities', require('./routes/activities.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/settings', require('./routes/setting.routes'));
app.use('/api/stock-requests', require('./routes/stockRequests.routes'));
app.use('/api/reports', require('./routes/reports.routes'));

// Static Folders
app.use('/uploads', express.static('uploads'));

// Main Entry Point
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`[SOCKET-READY] Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server failed to start:', error);
  }
};

startServer();

module.exports = { app, server, io };
