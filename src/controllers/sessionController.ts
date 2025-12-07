import { Request, Response } from 'express';
import { sessionManager } from '../core/sessionManager';
import { IApiResponse, ISession } from '../types';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export class SessionController {

  // CRIAR SESSÃO
  async createSession(req: Request, res: Response) {
    try {
      const { deviceName, name } = req.body;
      const session = await sessionManager.createSession(deviceName, name);

      const response: IApiResponse = {
        success: true,
        data: session,
        message: 'Session created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Error creating session:', error);
      res.status(500).json({ success: false, error: 'Failed to create session' });
    }
  }

  // LISTAR SESSÕES
  async getSessions(req: Request, res: Response) {
    try {
      const sessions = sessionManager.getAllSessions();
      res.json({ success: true, data: sessions });
    } catch (error) {
      logger.error('Error getting sessions:', error);
      res.status(500).json({ success: false, error: 'Failed to get sessions' });
    }
  }

  // OBTER QR CODE DE UMA SESSÃO
  async getSessionQR(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const qrCode = await sessionManager.getSessionQRCode(sessionId);

      if (qrCode) {
        res.json({ success: true, data: { qrCode } });
      } else {
        res.status(404).json({ success: false, error: 'Session not found or QR code not available' });
      }
    } catch (error) {
      logger.error('Error getting session QR:', error);
      res.status(500).json({ success: false, error: 'Failed to get QR code' });
    }
  }

  // RECONEXÃO — GERAR NOVO QR E RECRIAR A SESSÃO
  async reconnectSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const sessionData = sessionManager.getSession(sessionId);

      if (!sessionData) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      logger.warn(`Reconnecting session ${sessionId}...`);
      await sessionManager.deleteSession(sessionId);

      const newSession = await sessionManager.createSession(
        sessionData.session.deviceName,
        sessionData.session.user?.name || undefined
      );

      res.json({
        success: true,
        message: 'Session reconnected successfully. New QR generated.',
        data: newSession
      });

    } catch (error) {
      logger.error('Error reconnecting session:', error);
      res.status(500).json({ success: false, error: 'Failed to reconnect session' });
    }
  }

  // DELETAR SESSÃO
  async deleteSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const deleted = await sessionManager.deleteSession(sessionId);

      if (deleted) {
        res.json({ success: true, message: 'Session deleted successfully' });
      } else {
        res.status(404).json({ success: false, error: 'Session not found' });
      }
    } catch (error) {
      logger.error('Error deleting session:', error);
      res.status(500).json({ success: false, error: 'Failed to delete session' });
    }
  }

  // STATUS DA SESSÃO
  async getSessionStatus(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const sessionData = sessionManager.getSession(sessionId);

      if (sessionData) {
        const status = await sessionData.client.getStatus();
        res.json({ success: true, data: status });
      } else {
        res.status(404).json({ success: false, error: 'Session not found' });
      }
    } catch (error) {
      logger.error('Error getting session status:', error);
      res.status(500).json({ success: false, error: 'Failed to get session status' });
    }
  }

  // ⭐ DEFINIR WEBHOOK INDIVIDUAL DA SESSÃO
  async setSessionWebhook(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { webhookUrl } = req.body;

      if (!webhookUrl || typeof webhookUrl !== 'string') {
        return res.status(400).json({ success: false, message: 'O campo "webhookUrl" é obrigatório' });
      }

      const sessionData = sessionManager.getSession(sessionId) as { session: ISession & { webhookUrl?: string }, client: any };
      if (!sessionData) {
        return res.status(404).json({ success: false, message: `Sessão ${sessionId} não encontrada` });
      }

      const configDir = path.join(process.env.PATCH_TOKENS || './sessions', sessionId);
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

      const configPath = path.join(configDir, 'config.json');
      let config: any = {};
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }

      config['webhookUrl'] = webhookUrl;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      sessionData.session.webhookUrl = webhookUrl;

      res.json({ success: true, message: `Webhook atualizado para a sessão ${sessionId}`, webhookUrl });

    } catch (error: any) {
      logger.error('Erro ao definir webhook da sessão:', error);
      res.status(500).json({ success: false, message: 'Erro ao atualizar webhook', error: error.message });
    }
  }

  // ⭐ DELETAR WEBHOOK INDIVIDUAL DA SESSÃO
  async deleteSessionWebhook(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;

      const sessionData = sessionManager.getSession(sessionId) as { session: ISession & { webhookUrl?: string }, client: any };
      if (!sessionData) {
        return res.status(404).json({ success: false, message: `Sessão ${sessionId} não encontrada` });
      }

      const configDir = path.join(process.env.PATCH_TOKENS || './sessions', sessionId);
      const configPath = path.join(configDir, 'config.json');

      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        delete config['webhookUrl'];
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      }

      delete sessionData.session.webhookUrl;

      res.json({ success: true, message: `Webhook removido da sessão ${sessionId}` });

    } catch (error: any) {
      logger.error('Erro ao deletar webhook da sessão:', error);
      res.status(500).json({ success: false, message: 'Erro ao deletar webhook', error: error.message });
    }
  }
}
