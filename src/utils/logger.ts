// /root/api/big2/beta/api-big-conect/src/utils/logger.ts
import pino from 'pino';

// Configuração do logger para desenvolvimento e produção
const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

export { logger };

// Criar loggers específicos
export const whatsappLogger = logger.child({ module: 'whatsapp' });
export const apiLogger = logger.child({ module: 'api' });
export const sessionLogger = logger.child({ module: 'session' });