// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-api-key'] as string;

  if (!key) {
    return res.status(401).json({
      success: false,
      error: 'Missing API Key. Use x-api-key header.'
    });
  }

  if (key === ENV.SECRET_KEY) {
    req.user = { role: 'admin' };
    return next();
  }

  if (key === ENV.SECRET_APIKEY) {
    req.user = { role: 'client' };
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Invalid API Key'
  });
}
