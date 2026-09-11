import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/env.config.js';
import routes from './routes/index.js';
import { apiRateLimiter } from './middlewares/rateLimiter.middleware.js';
import { notFound } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin === '*' ? '*' : [config.corsOrigin, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  })
);

// Global Rate Limiting
app.use(apiRateLimiter);

// Logging Middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request Parsers
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// Mount Central Modular Routes
app.use(routes);

// 404 & Global Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
