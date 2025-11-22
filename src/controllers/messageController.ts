// /root/api/big2/beta/api-big-conect/src/controllers/messageController.ts
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { sessionManager } from '../core/sessionManager';
import { IApiResponse, IMessage } from '../types';
import { logger } from '../utils/logger';
import { formatJid, isValidPhoneNumber } from '../utils/helpers';
import { AntiBanHelper } from '../utils/antiBanHelper';

export class MessageController {
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

  async sendMedia(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, mediaUrl, type, caption, fileName, ptt } = req.body;

      if (!to || !mediaUrl || !type) {
        const response: IApiResponse = {
          success: false,
          error: 'Missing required fields: to, mediaUrl, and type'
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
      let messageContent: any;

      switch (type) {
        case 'image':
          if (this.isLocalPath(mediaUrl)) {
            const absolutePath = this.resolveLocalPath(mediaUrl);
            if (!fs.existsSync(absolutePath)) {
              throw new Error(`Arquivo de imagem não encontrado: ${absolutePath}`);
            }
            messageContent = {
              image: fs.readFileSync(absolutePath),
              caption: caption || '',
              mimetype: this.getMimeType(absolutePath)
            };
          } else {
            const directUrl = await this.getDirectMediaUrl(mediaUrl);
            messageContent = {
              image: { url: directUrl },
              caption: caption || '',
              mimetype: this.getMimeTypeFromUrl(directUrl)
            };
          }
          break;

        case 'video':
          if (this.isLocalPath(mediaUrl)) {
            const absolutePath = this.resolveLocalPath(mediaUrl);
            if (!fs.existsSync(absolutePath)) {
              throw new Error(`Arquivo de vídeo não encontrado: ${absolutePath}`);
            }
            messageContent = {
              video: fs.readFileSync(absolutePath),
              caption: caption || '',
              mimetype: this.getMimeType(absolutePath)
            };
          } else {
            const directUrl = await this.getDirectMediaUrl(mediaUrl);
            messageContent = {
              video: { url: directUrl },
              caption: caption || '',
              mimetype: this.getMimeTypeFromUrl(directUrl)
            };
          }
          break;

        case 'audio':
          // CORREÇÃO: Sempre enviar como PTT (mensagem de voz) por padrão
          const shouldBePTT = ptt !== undefined ? ptt : true;
          
          if (this.isLocalPath(mediaUrl)) {
            const absolutePath = this.resolveLocalPath(mediaUrl);
            
            if (!fs.existsSync(absolutePath)) {
              throw new Error(`Arquivo de áudio não encontrado: ${absolutePath}`);
            }

            const audioBuffer = await fs.promises.readFile(absolutePath);
            
            if (audioBuffer.length > 16 * 1024 * 1024) {
              throw new Error('Arquivo de áudio muito grande. Máximo 16MB permitido.');
            }

            const mimetype = this.getMimeType(absolutePath);
            
            messageContent = {
              audio: audioBuffer,
              mimetype: mimetype,
              ptt: shouldBePTT
            };

            logger.info(`Enviando áudio local como ${shouldBePTT ? 'mensagem de voz (PTT)' : 'arquivo de áudio'}`);

          } else {
            const { buffer, finalMimetype } = await this.downloadAndValidateAudio(mediaUrl);
            
            messageContent = {
              audio: buffer,
              mimetype: finalMimetype,
              ptt: shouldBePTT
            };

            logger.info(`Enviando áudio URL como ${shouldBePTT ? 'mensagem de voz (PTT)' : 'arquivo de áudio'}`);
          }
          break;

        case 'document':
          if (this.isLocalPath(mediaUrl)) {
            const absolutePath = this.resolveLocalPath(mediaUrl);
            if (!fs.existsSync(absolutePath)) {
              throw new Error(`Arquivo de documento não encontrado: ${absolutePath}`);
            }
            messageContent = {
              document: fs.readFileSync(absolutePath),
              caption: caption || '',
              fileName: fileName || path.basename(absolutePath),
              mimetype: this.getMimeType(absolutePath)
            };
          } else {
            const directUrl = await this.getDirectMediaUrl(mediaUrl);
            messageContent = {
              document: { url: directUrl },
              caption: caption || '',
              fileName: fileName || 'document',
              mimetype: this.getMimeTypeFromUrl(directUrl)
            };
          }
          break;

        case 'sticker':
          if (this.isLocalPath(mediaUrl)) {
            const absolutePath = this.resolveLocalPath(mediaUrl);
            if (!fs.existsSync(absolutePath)) {
              throw new Error(`Arquivo de sticker não encontrado: ${absolutePath}`);
            }
            messageContent = {
              sticker: fs.readFileSync(absolutePath)
            };
          } else {
            const directUrl = await this.getDirectMediaUrl(mediaUrl);
            messageContent = {
              sticker: { url: directUrl }
            };
          }
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
          type: type,
          ptt: messageContent.ptt || false
        },
        message: `Media message sent successfully as ${messageContent.ptt ? 'voice message' : 'audio file'}`
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

      const messageContent: any = {
        text,
        footer: footer || '',
        buttons: buttonRows,
        headerType: 1
      };

      if (image && image.url) {
        if (this.isLocalPath(image.url)) {
          const absolutePath = this.resolveLocalPath(image.url);
          if (!fs.existsSync(absolutePath)) {
            throw new Error(`Arquivo de imagem não encontrado: ${absolutePath}`);
          }
          messageContent.image = fs.readFileSync(absolutePath);
        } else {
          const directUrl = await this.getDirectMediaUrl(image.url);
          messageContent.image = { url: directUrl };
        }
        messageContent.headerType = 4;
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
            switch (message.media.type) {
              case 'image':
                if (this.isLocalPath(message.media.url)) {
                  const absolutePath = this.resolveLocalPath(message.media.url);
                  if (!fs.existsSync(absolutePath)) {
                    throw new Error(`Arquivo de imagem não encontrado: ${absolutePath}`);
                  }
                  messageContent = {
                    image: fs.readFileSync(absolutePath),
                    caption: message.media.caption || ''
                  };
                } else {
                  const directUrl = await this.getDirectMediaUrl(message.media.url);
                  messageContent = {
                    image: { url: directUrl },
                    caption: message.media.caption || ''
                  };
                }
                break;
              case 'video':
                if (this.isLocalPath(message.media.url)) {
                  const absolutePath = this.resolveLocalPath(message.media.url);
                  if (!fs.existsSync(absolutePath)) {
                    throw new Error(`Arquivo de vídeo não encontrado: ${absolutePath}`);
                  }
                  messageContent = {
                    video: fs.readFileSync(absolutePath),
                    caption: message.media.caption || ''
                  };
                } else {
                  const directUrl = await this.getDirectMediaUrl(message.media.url);
                  messageContent = {
                    video: { url: directUrl },
                    caption: message.media.caption || ''
                  };
                }
                break;
              case 'audio':
                const bulkPTT = message.media.ptt !== undefined ? message.media.ptt : true;
                
                if (this.isLocalPath(message.media.url)) {
                  const absolutePath = this.resolveLocalPath(message.media.url);
                  
                  if (!fs.existsSync(absolutePath)) {
                    throw new Error(`Arquivo de áudio não encontrado: ${absolutePath}`);
                  }

                  const audioBuffer = await fs.promises.readFile(absolutePath);
                  
                  if (audioBuffer.length > 16 * 1024 * 1024) {
                    throw new Error('Arquivo de áudio muito grande. Máximo 16MB permitido.');
                  }

                  messageContent = {
                    audio: audioBuffer,
                    mimetype: this.getMimeType(absolutePath),
                    ptt: bulkPTT
                  };
                } else {
                  const { buffer, finalMimetype } = await this.downloadAndValidateAudio(message.media.url);
                  
                  messageContent = {
                    audio: buffer,
                    mimetype: finalMimetype,
                    ptt: bulkPTT
                  };
                }
                break;
              case 'document':
                if (this.isLocalPath(message.media.url)) {
                  const absolutePath = this.resolveLocalPath(message.media.url);
                  if (!fs.existsSync(absolutePath)) {
                    throw new Error(`Arquivo de documento não encontrado: ${absolutePath}`);
                  }
                  messageContent = {
                    document: fs.readFileSync(absolutePath),
                    caption: message.media.caption || '',
                    fileName: message.media.fileName || path.basename(absolutePath)
                  };
                } else {
                  const directUrl = await this.getDirectMediaUrl(message.media.url);
                  messageContent = {
                    document: { url: directUrl },
                    caption: message.media.caption || '',
                    fileName: message.media.fileName || 'document'
                  };
                }
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

  // Método para download e validação de áudio
  private async downloadAndValidateAudio(url: string): Promise<{ buffer: Buffer; finalMimetype: string }> {
    try {
      logger.info(`Downloading audio from URL: ${url}`);
      
      const directUrl = await this.getDirectMediaUrl(url);
      
      const response = await axios.get(directUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: 16 * 1024 * 1024,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const buffer = Buffer.from(response.data);
      
      if (buffer.length > 16 * 1024 * 1024) {
        throw new Error('Arquivo de áudio muito grande. Máximo 16MB permitido.');
      }

      if (buffer.length < 100) {
        throw new Error('Arquivo de áudio muito pequeno ou inválido');
      }

      let finalMimetype = this.getMimeTypeFromUrl(directUrl);
      
      if (this.isValidAudioBuffer(buffer, finalMimetype)) {
        logger.info(`Audio downloaded successfully: ${buffer.length} bytes, mimetype: ${finalMimetype}`);
        return { buffer, finalMimetype };
      } else {
        throw new Error('Arquivo não é um áudio válido ou formato não suportado');
      }

    } catch (error: any) {
      logger.error(`Error downloading audio from ${url}:`, error);
      throw new Error(`Falha ao baixar áudio: ${error.message}`);
    }
  }

  // Validar se é um arquivo de áudio válido
  private isValidAudioBuffer(buffer: Buffer, mimetype: string): boolean {
    if (buffer.length < 10) return false;

    const header = buffer.slice(0, 8).toString('hex');
    
    // WAV: RIFF header
    if (header.startsWith('52494646') && mimetype.includes('wav')) {
      return true;
    }
    
    // MP3: ID3 header ou FF FB (MPEG)
    if ((header.startsWith('494433') || buffer.slice(0, 2).toString('hex') === 'fffb') && mimetype.includes('mpeg')) {
      return true;
    }
    
    // OGG: OggS header
    if (header.startsWith('4f676753') && mimetype.includes('ogg')) {
      return true;
    }

    // Se não reconhecer o header, confia no mimetype
    return mimetype.startsWith('audio/');
  }

  private isLocalPath(url: string): boolean {
    return !url.startsWith('http://') && 
           !url.startsWith('https://') && 
           !url.startsWith('data:');
  }

  private resolveLocalPath(filePath: string): string {
    if (filePath.startsWith('./') || filePath.startsWith('../')) {
      return path.resolve(process.cwd(), filePath);
    }
    
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    
    return path.resolve(process.cwd(), 'Imagem-exemplos', filePath);
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.aac': 'audio/aac',
      '.m4a': 'audio/mp4',
      '.flac': 'audio/flac',
      '.amr': 'audio/amr',
      '.opus': 'audio/opus',
      '.weba': 'audio/webm',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private getMimeTypeFromUrl(url: string): string {
    const ext = path.extname(url.split('?')[0]).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.aac': 'audio/aac',
      '.m4a': 'audio/mp4',
      '.flac': 'audio/flac',
      '.amr': 'audio/amr',
      '.opus': 'audio/opus',
      '.weba': 'audio/webm',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private async getDirectMediaUrl(url: string): Promise<string> {
    try {
      if (url.includes('raw.githubusercontent.com') || 
          url.includes('cdn.discordapp.com') ||
          url.includes('i.imgur.com') ||
          url.match(/\.(jpg|jpeg|png|gif|webp|mp4|avi|mov|mp3|wav|ogg|aac|m4a|flac|amr|opus|weba|pdf)(\?.*)?$/i)) {
        return url;
      }

      if (url.includes('github.com') && url.includes('/blob/')) {
        return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      }

      if (url.includes('github.com') && url.includes('/wavs/')) {
        return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      }

      const response = await axios.head(url, {
        timeout: 5000,
        validateStatus: (status) => status < 400
      });

      const contentType = response.headers['content-type'];
      
      if (contentType && contentType.includes('text/html')) {
        logger.warn(`URL parece ser uma página HTML, não uma mídia direta: ${url}`);
      }

      return url;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.warn(`Não foi possível verificar a URL ${url}, usando como está:`, errorMessage);
      return url;
    }
  }
}