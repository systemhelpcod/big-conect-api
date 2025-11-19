// /root/api/big2/beta/api-big-conect/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env';
import { logger, apiLogger } from './utils/logger';
import sessionRoutes from './routes/sessionRoutes';
import messageRoutes from './routes/messageRoutes';

class Server {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.start();
  }

  private config() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
      }
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      apiLogger.info(`${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Big-Conect-WhatsApp-API',
        version: '1.1.0'
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Big Conect WhatsApp API is running!',
        version: '1.1.0',
        endpoints: {
          sessions: '/api/sessions',
          messages: '/api/:sessionId/messages'
        }
      });
    });
  }

  private routes() {
    this.app.use('/api', sessionRoutes);
    this.app.use('/api', messageRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
      });
    });

    // Error handling middleware
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      apiLogger.error('Unhandled error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    });
  }

  private start() {
    this.app.listen(ENV.PORT, ENV.IPV4, () => {
      logger.info(`🚀 Big Conect WhatsApp API is running!`);
      logger.info(`📍 Environment: ${ENV.NODE_ENV}`);
      logger.info(`📍 Port: ${ENV.PORT}`);
      logger.info(`📍 IP: ${ENV.IPV4}`);
      logger.info(`📍 Health: http://${ENV.IPV4}:${ENV.PORT}/health`);
      
      if (ENV.IPV6) {
        logger.info(`📍 IPv6 Server: http://[${ENV.IPV6}]:${ENV.PORT}`);
      }
      
      logger.info(`📍 API Documentation: http://${ENV.IPV4}:${ENV.PORT}/`);
    });
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
new Server();