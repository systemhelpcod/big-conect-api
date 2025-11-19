// /root/api/big2/beta/api-big-conect/src/controllers/messageController.ts
import { Request, Response } from 'express';
import { sessionManager } from '../core/sessionManager';
import { IApiResponse, IMessage } from '../types';
import { logger } from '../utils/logger';
import { formatJid, isValidPhoneNumber } from '../utils/helpers';
import { AntiBanHelper } from '../utils/antiBanHelper';
import { UserAgentHelper } from '../utils/userAgentHelper';

export class MessageController {
  async sendText(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, text } = req.body;

      // Validações básicas
      if (!to || !text) {
        const response: IApiResponse = {
          success: false,
          error: 'Missing required fields: to and text'
        };
        return res.status(400).json(response);
      }

      // Validação de formato de telefone
      if (!isValidPhoneNumber(to)) {
        const response: IApiResponse = {
          success: false,
          error: 'Invalid phone number format'
        };
        return res.status(400).json(response);
      }

      // Validação anti-ban
      if (!AntiBanHelper.validatePhoneNumber(to)) {
        const response: IApiResponse = {
          success: false,
          error: 'Phone number appears to be invalid or suspicious'
        };
        return res.status(400).json(response);
      }

      // Verificar limites de mensagens
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

  async sendMedia(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, mediaUrl, type, caption, fileName } = req.body;

      // Validações básicas
      if (!to || !mediaUrl || !type) {
        const response: IApiResponse = {
          success: false,
          error: 'Missing required fields: to, mediaUrl, and type'
        };
        return res.status(400).json(response);
      }

      // Validação de formato de telefone
      if (!isValidPhoneNumber(to)) {
        const response: IApiResponse = {
          success: false,
          error: 'Invalid phone number format'
        };
        return res.status(400).json(response);
      }

      // Validação anti-ban
      if (!AntiBanHelper.validatePhoneNumber(to)) {
        const response: IApiResponse = {
          success: false,
          error: 'Phone number appears to be invalid or suspicious'
        };
        return res.status(400).json(response);
      }

      // Verificar limites de mensagens
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
      let messageContent: any;

      switch (type) {
        case 'image':
          messageContent = {
            image: { url: mediaUrl },
            caption: caption || '',
            mimetype: 'image/jpeg'
          };
          break;
        case 'video':
          messageContent = {
            video: { url: mediaUrl },
            caption: caption || '',
            mimetype: 'video/mp4'
          };
          break;
        case 'audio':
          messageContent = {
            audio: { url: mediaUrl },
            mimetype: 'audio/mp4',
            ptt: req.body.ptt || false
          };
          break;
        case 'document':
          messageContent = {
            document: { url: mediaUrl },
            caption: caption || '',
            fileName: fileName || 'document',
            mimetype: req.body.mimetype || 'application/octet-stream'
          };
          break;
        case 'sticker':
          messageContent = {
            sticker: { url: mediaUrl }
          };
          break;
        default:
          const response: IApiResponse = {
            success: false,
            error: 'Unsupported media type. Supported types: image, video, audio, document, sticker'
          };
          return res.status(400).json(response);
      }

      const result = await sessionManager.sendMessage(sessionId, jid, messageContent);

      const response: IApiResponse = {
        success: true,
        data: { 
          messageId: result.key.id,
          timestamp: new Date().toISOString(),
          type: type
        },
        message: 'Media message sent successfully'
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error sending media message:', error);
      
      const response: IApiResponse = {
        success: false,
        error: error.message || 'Failed to send media message'
      };
      
      res.status(500).json(response);
    }
  }

  async sendButtons(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, text, buttons, footer, image } = req.body;

      // Validações básicas
      if (!to || !text || !buttons) {
        const response: IApiResponse = {
          success: false,
          error: 'Missing required fields: to, text, and buttons'
        };
        return res.status(400).json(response);
      }

      // Validação de formato de telefone
      if (!isValidPhoneNumber(to)) {
        const response: IApiResponse = {
          success: false,
          error: 'Invalid phone number format'
        };
        return res.status(400).json(response);
      }

      // Validação anti-ban
      if (!AntiBanHelper.validatePhoneNumber(to)) {
        const response: IApiResponse = {
          success: false,
          error: 'Phone number appears to be invalid or suspicious'
        };
        return res.status(400).json(response);
      }

      // Verificar limites de mensagens
      const canSend = AntiBanHelper.canSendMessage(sessionId);
      if (!canSend.allowed) {
        const response: IApiResponse = {
          success: false,
          error: canSend.reason,
          data: { waitTime: canSend.waitTime }
        };
        return res.status(429).json(response);
      }

      // Validar botões
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

      const messageContent: any = {
        text,
        footer: footer || '',
        buttons: buttonRows,
        headerType: 1
      };

      // Adicionar imagem se fornecida
      if (image && image.url) {
        messageContent.image = { url: image.url };
        messageContent.headerType = 4; // Header type for image
      }

      const result = await sessionManager.sendMessage(sessionId, jid, messageContent);

      const response: IApiResponse = {
        success: true,
        data: { 
          messageId: result.key.id,
          timestamp: new Date().toISOString(),
          buttonsCount: buttons.length
        },
        message: 'Buttons message sent successfully'
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

  async sendTemplate(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, template } = req.body;

      // Validações básicas
      if (!to || !template) {
        const response: IApiResponse = {
          success: false,
          error: 'Missing required fields: to and template'
        };
        return res.status(400).json(response);
      }

      // Validação de formato de telefone
      if (!isValidPhoneNumber(to)) {
        const response: IApiResponse = {
          success: false,
          error: 'Invalid phone number format'
        };
        return res.status(400).json(response);
      }

      // Validação anti-ban
      if (!AntiBanHelper.validatePhoneNumber(to)) {
        const response: IApiResponse = {
          success: false,
          error: 'Phone number appears to be invalid or suspicious'
        };
        return res.status(400).json(response);
      }

      // Verificar limites de mensagens
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

      // Validações básicas
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        const response: IApiResponse = {
          success: false,
          error: 'Messages array is required and must not be empty'
        };
        return res.status(400).json(response);
      }

      // Limitar quantidade de mensagens em massa
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
          // Delay entre mensagens em massa (com comportamento humano)
          if (index > 0) {
            const safeDelay = AntiBanHelper.getSafeMessageInterval();
            await AntiBanHelper.delay(safeDelay);
          }

          // Verificar limites a cada mensagem
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

          // Validação anti-ban para cada número
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

          // Determinar o tipo de conteúdo da mensagem
          if (message.text && !message.media) {
            messageContent = { text: message.text };
          } else if (message.media) {
            switch (message.media.type) {
              case 'image':
                messageContent = {
                  image: { url: message.media.url },
                  caption: message.media.caption || ''
                };
                break;
              case 'video':
                messageContent = {
                  video: { url: message.media.url },
                  caption: message.media.caption || ''
                };
                break;
              case 'audio':
                messageContent = {
                  audio: { url: message.media.url }
                };
                break;
              case 'document':
                messageContent = {
                  document: { url: message.media.url },
                  caption: message.media.caption || '',
                  fileName: message.media.fileName || 'document'
                };
                break;
              default:
                throw new Error(`Unsupported media type: ${message.media.type}`);
            }
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

          // Se falhar muitas vezes consecutivas, parar o processo
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

  async sendListMessage(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, text, buttonText, sections, title, footer } = req.body;

      // Validações básicas
      if (!to || !text || !buttonText || !sections) {
        const response: IApiResponse = {
          success: false,
          error: 'Missing required fields: to, text, buttonText, and sections'
        };
        return res.status(400).json(response);
      }

      // Validação de formato de telefone
      if (!isValidPhoneNumber(to)) {
        const response: IApiResponse = {
          success: false,
          error: 'Invalid phone number format'
        };
        return res.status(400).json(response);
      }

      // Validação anti-ban
      if (!AntiBanHelper.validatePhoneNumber(to)) {
        const response: IApiResponse = {
          success: false,
          error: 'Phone number appears to be invalid or suspicious'
        };
        return res.status(400).json(response);
      }

      // Verificar limites de mensagens
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

  async sendReaction(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, messageId, reaction } = req.body;

      // Validações básicas
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
}