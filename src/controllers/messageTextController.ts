// /root/api/big2/beta/api-big-conect/src/controllers/messageTextController.ts
import { Request, Response } from 'express';
import { sessionManager } from '../core/sessionManager';
import { IApiResponse } from '../types';
import { logger } from '../utils/logger';
import { formatJid, isValidPhoneNumber } from '../utils/helpers';
import { AntiBanHelper } from '../utils/antiBanHelper';

export class MessageTextController {
  async sendText(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, text } = req.body;

      if (!to || !text) {
        const response: IApiResponse = {
          success: false,
          error: 'Missing required fields: to and text'
        };
        return res.status(400).json(response);
      }

      if (!isValidPhoneNumber(to)) {
        const response: IApiResponse = {
          success: false,
          error: 'Invalid phone number format'
        };
        return res.status(400).json(response);
      }

      if (!AntiBanHelper.validatePhoneNumber(to)) {
        const response: IApiResponse = {
          success: false,
          error: 'Phone number appears to be invalid or suspicious'
        };
        return res.status(400).json(response);
      }

      const canSend = AntiBanHelper.canSendMessage(sessionId);
      if (!canSend.allowed) {
        const response: IApiResponse = {
          success: false,
          error: canSend.reason,
          data: { waitTime: canSend.waitTime }
        };
        return res.status(429).json(response);
      }

      const jid = formatJid(to);
      const result = await sessionManager.sendMessage(sessionId, jid, { text });

      const response: IApiResponse = {
        success: true,
        data: { 
          messageId: result.key.id,
          timestamp: new Date().toISOString()
        },
        message: 'Message sent successfully'
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error sending text message:', error);
      
      const response: IApiResponse = {
        success: false,
        error: error.message || 'Failed to send message'
      };
      
      res.status(500).json(response);
    }
  }
}