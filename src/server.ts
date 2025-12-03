// /src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env';
import { logger, apiLogger } from './utils/logger';

// 🔐 Middleware de autenticação
import { authMiddleware } from './middleware/authMiddleware';

// Rotas
import sessionRoutes from './routes/sessionRoutes';
import messageRoutes from './routes/messageRoutes';

class Server {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.startServer();
  }

  private config() {
    // Segurança básica
    this.app.use(helmet());

    // CORS aberto para qualquer origem
    this.app.use(cors({
      origin: '*', // aceita qualquer site
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
      // sem credentials
    }));

    // Pré-flights OPTIONS
    this.app.options('*', (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.sendStatus(200);
    });

    // Limite de requisições
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100,
      message: { success: false, error: 'Too many requests from this IP, please try again later.' }
    });
    this.app.use(limiter);

    // Body parser
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Logger simples
    this.app.use((req, res, next) => {
      apiLogger.info(`${req.method} ${req.path} - IP: ${req.ip}`);
      next();
    });

    // Endpoint de saúde
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Big-Conect-WhatsApp-API',
        version: '1.1.0'
      });
    });

    // Endpoint raiz
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

    // Middleware de autenticação só para /api
    this.app.use('/api', authMiddleware);
  }

  private routes() {
    this.app.use('/api', sessionRoutes);
    this.app.use('/api', messageRoutes);

    // 404
    this.app.use('*', (req, res) => {
      res.status(404).json({ success: false, error: 'Endpoint not found', path: req.originalUrl });
    });

    // Error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      apiLogger.error('Unhandled error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    });
  }

  private startServer() {
    const port = ENV.PORT || 9009;
    const host = ENV.IPV4 || '0.0.0.0';
    this.app.listen(port, host, () => {
      logger.info(`➡️ HTTP Server running at http://${host}:${port}`);
      logger.info(`✅ CORS origin allowed: * (any)`);
    });
  }
}

// Encerramento seguro
process.on('SIGINT', () => { logger.info('Shutting down gracefully...'); process.exit(0); });
process.on('SIGTERM', () => { logger.info('Received SIGTERM, shutting down gracefully...'); process.exit(0); });
process.on('uncaughtException', (err) => { logger.error('Uncaught Exception:', err); process.exit(1); });
process.on('unhandledRejection', (reason, promise) => { logger.error('Unhandled Rejection at:', promise, 'reason:', reason); process.exit(1); });

// Inicializar servidor
new Server();
