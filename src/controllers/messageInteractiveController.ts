// /root/api/big2/beta/api-big-conect/src/controllers/messageInteractiveController.ts
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { sessionManager } from '../core/sessionManager';
import { IApiResponse } from '../types';
import { logger } from '../utils/logger';
import { formatJid, isValidPhoneNumber } from '../utils/helpers';
import { AntiBanHelper } from '../utils/antiBanHelper';
import { MessageImageController } from './messageImageController';

export class MessageInteractiveController {
  private imageController: MessageImageController;

  constructor() {
    this.imageController = new MessageImageController();
  }

  async sendButtons(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, text, buttons, footer, image } = req.body;

      if (!to || !text || !buttons) {
        const response: IApiResponse = {
          success: false,
          error: 'Missing required fields: to, text, and buttons'
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

      if (!Array.isArray(buttons) || buttons.length === 0 || buttons.length > 3) {
        const response: IApiResponse = {
          success: false,
          error: 'Buttons must be an array with 1 to 3 buttons'
        };
        return res.status(400).json(response);
      }

      const jid = formatJid(to);
      const buttonRows = buttons.map((button: any, index: number) => ({
        buttonId: button.id || `btn${index + 1}`,
        buttonText: { displayText: button.text },
        type: 1
      }));

      let messageContent: any;

      if (image && image.url) {
        // Estrutura para botões com imagem
        messageContent = {
          caption: text,
          footer: footer || '',
          buttons: buttonRows,
          headerType: 4
        };

        // Processar a imagem usando métodos públicos do imageController
        if (this.imageController.isBase64DataPublic(image.url)) {
          const imageResult = await this.imageController.processBase64ImagePublic(image.url);
          messageContent.image = { url: imageResult.filePath };
        } else if (this.imageController.isLocalPathPublic(image.url)) {
          const absolutePath = this.imageController.resolveLocalPathPublic(image.url);
          if (!fs.existsSync(absolutePath)) {
            throw new Error(`Arquivo de imagem não encontrado: ${absolutePath}`);
          }
          messageContent.image = { url: absolutePath };
        } else {
          const directUrl = await this.imageController.getDirectMediaUrlPublic(image.url);
          messageContent.image = { url: directUrl };
        }
      } else {
        // Estrutura para botões sem imagem
        messageContent = {
          text,
          footer: footer || '',
          buttons: buttonRows,
          headerType: 1
        };
      }

      const result = await sessionManager.sendMessage(sessionId, jid, messageContent);

      const response: IApiResponse = {
        success: true,
        data: { 
          messageId: result.key.id,
          timestamp: new Date().toISOString(),
          buttonsCount: buttons.length,
          hasImage: !!(image && image.url)
        },
        message: image && image.url ? 'Buttons message with image sent successfully' : 'Buttons message sent successfully'
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error sending buttons message:', error);
      
      const response: IApiResponse = {
        success: false,
        error: error.message || 'Failed to send buttons message'
      };
      
      res.status(500).json(response);
    }
  }

  async sendListMessage(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, text, buttonText, sections, title, footer } = req.body;

      if (!to || !text || !buttonText || !sections) {
        const response: IApiResponse = {
          success: false,
          error: 'Missing required fields: to, text, buttonText, and sections'
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

      if (!Array.isArray(sections) || sections.length === 0) {
        const response: IApiResponse = {
          success: false,
          error: 'Sections must be a non-empty array'
        };
        return res.status(400).json(response);
      }

      const jid = formatJid(to);
      const messageContent = {
        text,
        footer: footer || '',
        title: title || '',
        buttonText,
        sections
      };

      const result = await sessionManager.sendMessage(sessionId, jid, messageContent);

      const response: IApiResponse = {
        success: true,
        data: { 
          messageId: result.key.id,
          timestamp: new Date().toISOString(),
          sectionsCount: sections.length
        },
        message: 'List message sent successfully'
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error sending list message:', error);
      
      const response: IApiResponse = {
        success: false,
        error: error.message || 'Failed to send list message'
      };
      
      res.status(500).json(response);
    }
  }

  async sendTemplate(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, template } = req.body;

      if (!to || !template) {
        const response: IApiResponse = {
          success: false,
          error: 'Missing required fields: to and template'
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
      const result = await sessionManager.sendMessage(sessionId, jid, template);

      const response: IApiResponse = {
        success: true,
        data: { 
          messageId: result.key.id,
          timestamp: new Date().toISOString()
        },
        message: 'Template message sent successfully'
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error sending template message:', error);
      
      const response: IApiResponse = {
        success: false,
        error: error.message || 'Failed to send template message'
      };
      
      res.status(500).json(response);
    }
  }

  async sendBulkMessages(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { messages, delayBetweenMessages = 2000 } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        const response: IApiResponse = {
          success: false,
          error: 'Messages array is required and must not be empty'
        };
        return res.status(400).json(response);
      }

      if (messages.length > 50) {
        const response: IApiResponse = {
          success: false,
          error: 'Maximum 50 messages allowed in bulk operations'
        };
        return res.status(400).json(response);
      }

      const results: any[] = [];
      const failed: any[] = [];

      for (const [index, message] of messages.entries()) {
        try {
          if (index > 0) {
            const safeDelay = AntiBanHelper.getSafeMessageInterval();
            await AntiBanHelper.delay(safeDelay);
          }

          const canSend = AntiBanHelper.canSendMessage(sessionId);
          if (!canSend.allowed) {
            failed.push({
              to: message.to,
              error: canSend.reason,
              index,
              status: 'failed'
            });
            continue;
          }

          if (!AntiBanHelper.validatePhoneNumber(message.to)) {
            failed.push({
              to: message.to,
              error: 'Invalid or suspicious phone number',
              index,
              status: 'failed'
            });
            continue;
          }

          const jid = formatJid(message.to);
          let messageContent: any;

          if (message.text && !message.media) {
            messageContent = { text: message.text };
          } else if (message.media) {
            messageContent = await this.processMediaMessage(message.media, message.media.type);
          } else if (message.buttons) {
            const buttonRows = message.buttons.map((button: any, btnIndex: number) => ({
              buttonId: button.id || `btn${btnIndex + 1}`,
              buttonText: { displayText: button.text },
              type: 1
            }));

            messageContent = {
              text: message.text,
              footer: message.footer || '',
              buttons: buttonRows,
              headerType: 1
            };
          } else {
            throw new Error('Invalid message format');
          }

          const result = await sessionManager.sendMessage(sessionId, jid, messageContent);

          results.push({
            to: message.to,
            messageId: result.key.id,
            index,
            status: 'sent',
            timestamp: new Date().toISOString()
          });

          logger.info(`Bulk message ${index + 1}/${messages.length} sent to ${message.to}`);

        } catch (error: any) {
          failed.push({
            to: message.to,
            error: error.message,
            index,
            status: 'failed',
            timestamp: new Date().toISOString()
          });

          logger.error(`Error in bulk message ${index + 1} to ${message.to}:`, error);

          if (failed.length >= 5 && failed.slice(-5).every(f => f.status === 'failed')) {
            logger.warn('Stopping bulk send due to multiple consecutive failures');
            break;
          }
        }
      }

      const response: IApiResponse = {
        success: true,
        data: {
          total: messages.length,
          sent: results.length,
          failed: failed.length,
          results,
          failedMessages: failed,
          summary: {
            successRate: ((results.length / messages.length) * 100).toFixed(2) + '%',
            completedAt: new Date().toISOString()
          }
        },
        message: `Bulk messages completed: ${results.length} successful, ${failed.length} failed`
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error sending bulk messages:', error);
      
      const response: IApiResponse = {
        success: false,
        error: error.message || 'Failed to send bulk messages'
      };
      
      res.status(500).json(response);
    }
  }

  async sendReaction(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, messageId, reaction } = req.body;

      if (!to || !messageId) {
        const response: IApiResponse = {
          success: false,
          error: 'Missing required fields: to and messageId'
        };
        return res.status(400).json(response);
      }

      const jid = formatJid(to);
      const messageContent = {
        react: {
          text: reaction || "👍",
          key: {
            remoteJid: jid,
            id: messageId
          }
        }
      };

      const result = await sessionManager.sendMessage(sessionId, jid, messageContent);

      const response: IApiResponse = {
        success: true,
        data: { 
          reactionId: result.key.id,
          timestamp: new Date().toISOString()
        },
        message: 'Reaction sent successfully'
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error sending reaction:', error);
      
      const response: IApiResponse = {
        success: false,
        error: error.message || 'Failed to send reaction'
      };
      
      res.status(500).json(response);
    }
  }

  private async processMediaMessage(media: any, type: string): Promise<any> {
    // Implementação simplificada para bulk messages
    switch (type) {
      case 'image':
        return {
          image: { url: media.url },
          caption: media.caption || ''
        };
      case 'video':
        return {
          video: { url: media.url },
          caption: media.caption || ''
        };
      case 'audio':
        return {
          audio: { url: media.url },
          mimetype: media.mimetype || 'audio/mpeg'
        };
      case 'document':
        return {
          document: { url: media.url },
          caption: media.caption || '',
          fileName: media.fileName || 'document'
        };
      default:
        throw new Error(`Unsupported media type: ${type}`);
    }
  }
}