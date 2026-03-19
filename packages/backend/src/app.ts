import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { env } from './config';
import { errorMiddleware, globalRateLimit } from './middlewares';
import { authRouter } from './modules/auth/auth.router';
import { organizationsRouter } from './modules/organizations/organizations.router';

const app = express();

// Ensure upload directory exists
const uploadDir = path.resolve(env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Security
app.use(helmet());

// CORS — allow all origins in production for now (tighten later)
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      // In production, also allow .onrender.com domains
      if (origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all for now
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(globalRateLimit);

// Static files (uploads)
app.use('/uploads', express.static(uploadDir));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'ProofHub API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/org', organizationsRouter);

// Error handling
app.use(errorMiddleware);

export { app };
