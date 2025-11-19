import { Request, Response } from 'express';
import { sessionManager } from '../core/sessionManager';
import { IApiResponse } from '../types';
import { logger } from '../utils/logger';

export class SessionController {
  async createSession(req: Request, res: Response) {
    try {
      const session = await sessionManager.createSession();
      
      const response: IApiResponse = {
        success: true,
        data: session,
        message: 'Session created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      logger.error('Error creating session:', error);
      
      const response: IApiResponse = {
        success: false,
        error: 'Failed to create session'
      };
      
      res.status(500).json(response);
    }
  }

  async getSessions(req: Request, res: Response) {
    try {
      const sessions = sessionManager.getAllSessions();
      
      const response: IApiResponse = {
        success: true,
        data: sessions
      };
      
      res.json(response);
    } catch (error) {
      logger.error('Error getting sessions:', error);
      
      const response: IApiResponse = {
        success: false,
        error: 'Failed to get sessions'
      };
      
      res.status(500).json(response);
    }
  }

  async getSessionQR(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const qrCode = await sessionManager.getSessionQRCode(sessionId);
      
      if (qrCode) {
        const response: IApiResponse = {
          success: true,
          data: { qrCode }
        };
        res.json(response);
      } else {
        const response: IApiResponse = {
          success: false,
          error: 'Session not found or QR code not available'
        };
        res.status(404).json(response);
      }
    } catch (error) {
      logger.error('Error getting session QR:', error);
      
      const response: IApiResponse = {
        success: false,
        error: 'Failed to get QR code'
      };
      
      res.status(500).json(response);
    }
  }

  async deleteSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const deleted = await sessionManager.deleteSession(sessionId);
      
      if (deleted) {
        const response: IApiResponse = {
          success: true,
          message: 'Session deleted successfully'
        };
        res.json(response);
      } else {
        const response: IApiResponse = {
          success: false,
          error: 'Session not found'
        };
        res.status(404).json(response);
      }
    } catch (error) {
      logger.error('Error deleting session:', error);
      
      const response: IApiResponse = {
        success: false,
        error: 'Failed to delete session'
      };
      
      res.status(500).json(response);
    }
  }

  async getSessionStatus(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const sessionData = sessionManager.getSession(sessionId);
      
      if (sessionData) {
        const status = await sessionData.client.getStatus();
        
        const response: IApiResponse = {
          success: true,
          data: status
        };
        res.json(response);
      } else {
        const response: IApiResponse = {
          success: false,
          error: 'Session not found'
        };
        res.status(404).json(response);
      }
    } catch (error) {
      logger.error('Error getting session status:', error);
      
      const response: IApiResponse = {
        success: false,
        error: 'Failed to get session status'
      };
      
      res.status(500).json(response);
    }
  }
}