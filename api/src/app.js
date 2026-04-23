require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const logger = require('./config/logger');
const { AppError, ApiResponse } = require('./utils');
const authRouter = require('./modules/auth/auth.routes');
const applicationRouter = require('./modules/applications/application.routes');
const { metricsMiddleware, metricsHandler } = require('./modules/metrics/metrics');


const app = express();

// Security Middlewares
app.set('trust proxy', 1);
app.use(helmet());

// 1. Body Parser (Must be first to populate req.body)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 2. CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};
app.use(cors(corsOptions));

// 3. Data Sanitization against NoSQL injection
// Note: In Express 5, req.query is read-only. We sanitize the body manually.
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  next();
});

// 4. Prevent Parameter Pollution
app.use(hpp());

// 5. Rate Limiting
const limiter = rateLimit({
  max: 1000, // Increased for development/testing
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in 15 minutes!',
});
app.use('/api', limiter);

// Serve static files
app.use('/uploads', express.static('uploads'));

// Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Performance & Usage Monitoring
app.use(metricsMiddleware);

// Health Check
app.get('/health', (req, res) => {
  ApiResponse.success(res, { status: 'OK' }, 'System is healthy');
});
app.get('/api/v1/health', (req, res) => {
  ApiResponse.success(res, { status: 'OK' }, 'System is healthy');
});

// Prometheus Exposure
app.get('/api/v1/metrics', metricsHandler);

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/applications', applicationRouter);


// 404 Handler
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (err.name === 'JsonWebTokenError') {
    error.statusCode = 401;
    error.message = 'Invalid token. Please log in again!';
    error.isOperational = true;
  }
  if (err.name === 'TokenExpiredError') {
    error.statusCode = 401;
    error.message = 'Your token has expired! Please log in again.';
    error.isOperational = true;
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    error.message = `Invalid input data. ${errors.join('. ')}`;
    error.statusCode = 400;
    error.isOperational = true;
  }

  // Handle MongoDB Duplicate Key Error (11000)
  if (err.code === 11000) {
    const value = Object.values(err.keyValue)[0];
    error.message = `Duplicate field value: "${value}". Please use another value!`;
    error.statusCode = 400;
    error.isOperational = true;
  }

  // Handle MongoDB CastError (Invalid ID)
  if (err.name === 'CastError') {
    error.message = `Invalid ${err.path}: ${err.value}.`;
    error.statusCode = 400;
    error.isOperational = true;
  }

  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  // If 401, clear the isAuthenticated cookie to prevent client-side redirect loops
  if (error.statusCode === 401) {
    res.cookie('isAuthenticated', 'false', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: false,
    });
  }

  // Always log 500 errors to help debugging
  if (error.statusCode === 500) {
    console.error('Unhandled Server Error:', err);
  }

  if (process.env.NODE_ENV === 'development') {
    res.status(error.statusCode).json({
      success: false,
      status: error.status,
      error: err,
      message: error.message,
      stack: err.stack,
    });
  } else {
    // Production: Lean error response
    res.status(error.statusCode).json({
      success: false,
      message: error.isOperational ? error.message : 'Something went very wrong!',
    });
  }
});

module.exports = app;
