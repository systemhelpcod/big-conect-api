import { config } from 'dotenv';

config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '9009'),
  IPV4: process.env.IPV4 || '127.0.0.1',
  IPV6: process.env.IPV6,
  DOMAIN_SSL: process.env.DOMAIN_SSL,
  VIEW_QRCODE_TERMINAL: process.env.VIEW_QRCODE_TERMINAL === '1',
  PATCH_TOKENS: process.env.PATCH_TOKENS || './sessions',
  DEVICE_NAME: process.env.DEVICE_NAME || 'Big-Conect-API',
  HOST_NAME: process.env.HOST_NAME || 'BigConectAPI',
  WA_VERSION: process.env.WA_VERSION,
  WA_URL: process.env.WA_URL,
  AUTO_CLOSE: parseInt(process.env.AUTO_CLOSE || '15'),
  SECRET_KEY: process.env.SECRET_KEY || 'default-secret-key',
  WEBHOOK_URL: process.env.WEBHOOK_URL
};