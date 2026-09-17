require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const logRoutes = require('./routes/logRoutes');
const eventRoutes = require('./routes/eventRoutes');
const ruleRoutes = require('./routes/ruleRoutes');
const alertRoutes = require('./routes/alertRoutes');
const caseRoutes = require('./routes/caseRoutes');
const iocRoutes = require('./routes/iocRoutes');
const endpointRoutes = require('./routes/endpointRoutes');
const accountRoutes = require('./routes/accountRoutes');
const timelineRoutes = require('./routes/timelineRoutes');
const attackChainRoutes = require('./routes/attackChainRoutes');
const impactRoutes = require('./routes/impactRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev mode
    }
  },
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global lenient rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', globalLimiter);

// Static uploads directory
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    service: 'AEGIS SOC Forensic Platform API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/iocs', iocRoutes);
app.use('/api/endpoints', endpointRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/attack-chain', attackChainRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Boot server
async function startServer() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      logger.info(`AEGIS SOC Platform API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
    return server;
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
