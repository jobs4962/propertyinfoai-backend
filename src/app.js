import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import savedPropertyRoutes from './routes/savedPropertyRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { sendSuccess, sendError } from './utils/response.js';

const app = express();

// Security Middlewares
app.use(helmet());
// Dynamic CORS origin function supporting local Vite ports (5173, 5174, etc.)
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'https://property-shark.netlify.app',
  'https://property-shark.netlify.app/'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, origin);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Rate Limiter for Auth Endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    code: 'TOO_MANY_REQUESTS',
  },
});

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check
app.get('/api/health', (req, res) => {
  return sendSuccess(res, { timestamp: new Date().toISOString() }, 'Backend is running', 200);
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/saved-properties', savedPropertyRoutes);
app.use('/api/properties', propertyRoutes);

// 404 Route Handler
app.use((req, res) => {
  return sendError(res, `Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
});

// Centralized Error Middleware
app.use(errorHandler);

export default app;
