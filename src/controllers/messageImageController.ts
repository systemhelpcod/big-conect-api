// /root/api/big2/beta/api-big-conect/src/controllers/messageImageController.ts
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { sessionManager } from '../core/sessionManager';
import { IApiResponse } from '../types';
import { logger } from '../utils/logger';
import { formatJid, isValidPhoneNumber } from '../utils/helpers';
import { AntiBanHelper } from '../utils/antiBanHelper';

export class MessageImageController {
  async sendImage(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, mediaUrl, caption } = req.body;

      if (!to || !mediaUrl) {
        const response: IApiResponse = {
          success: false,
          error: 'Missing required fields: to and mediaUrl'
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

      if (this.isBase64DataPublic(mediaUrl)) {
        const imageResult = await this.processBase64ImagePublic(mediaUrl);
        messageContent = {
          image: { url: imageResult.filePath },
          caption: caption || '',
          mimetype: imageResult.mimetype
        };
      } else if (this.isLocalPathPublic(mediaUrl)) {
        const absolutePath = this.resolveLocalPathPublic(mediaUrl);
        if (!fs.existsSync(absolutePath)) {
          throw new Error(`Arquivo de imagem não encontrado: ${absolutePath}`);
        }
        messageContent = {
          image: { url: absolutePath },
          caption: caption || '',
          mimetype: this.getMimeType(absolutePath)
        };
      } else {
        const directUrl = await this.getDirectMediaUrlPublic(mediaUrl);
        messageContent = {
          image: { url: directUrl },
          caption: caption || '',
          mimetype: this.getMimeTypeFromUrl(directUrl)
        };
      }

      const result = await sessionManager.sendMessage(sessionId, jid, messageContent);

      const response: IApiResponse = {
        success: true,
        data: { 
          messageId: result.key.id,
          timestamp: new Date().toISOString(),
          type: 'image',
          isBase64: this.isBase64DataPublic(mediaUrl)
        },
        message: 'Image message sent successfully'
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error sending image message:', error);
      
      const response: IApiResponse = {
        success: false,
        error: error.message || 'Failed to send image message'
      };
      
      res.status(500).json(response);
    }
  }

  async sendSticker(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, mediaUrl } = req.body;

      if (!to || !mediaUrl) {
        const response: IApiResponse = {
          success: false,
          error: 'Missing required fields: to and mediaUrl'
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

      if (this.isBase64DataPublic(mediaUrl)) {
        const stickerResult = await this.processBase64Sticker(mediaUrl);
        messageContent = {
          sticker: { url: stickerResult.filePath }
        };
      } else if (this.isLocalPathPublic(mediaUrl)) {
        const absolutePath = this.resolveLocalPathPublic(mediaUrl);
        if (!fs.existsSync(absolutePath)) {
          throw new Error(`Arquivo de sticker não encontrado: ${absolutePath}`);
        }
        messageContent = {
          sticker: { url: absolutePath }
        };
      } else {
        const directUrl = await this.getDirectMediaUrlPublic(mediaUrl);
        messageContent = {
          sticker: { url: directUrl }
        };
      }

      const result = await sessionManager.sendMessage(sessionId, jid, messageContent);

      const response: IApiResponse = {
        success: true,
        data: { 
          messageId: result.key.id,
          timestamp: new Date().toISOString(),
          type: 'sticker',
          isBase64: this.isBase64DataPublic(mediaUrl)
        },
        message: 'Sticker sent successfully'
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error sending sticker:', error);
      
      const response: IApiResponse = {
        success: false,
        error: error.message || 'Failed to send sticker'
      };
      
      res.status(500).json(response);
    }
  }

  // ========== MÉTODOS PÚBLICOS PARA USO EXTERNO ==========

  public isBase64DataPublic(data: string): boolean {
    return this.isBase64Data(data);
  }

  public async processBase64ImagePublic(base64Data: string): Promise<{ filePath: string; mimetype: string }> {
    return this.processBase64Media(base64Data, 'image');
  }

  public isLocalPathPublic(url: string): boolean {
    return this.isLocalPath(url);
  }

  public resolveLocalPathPublic(filePath: string): string {
    return this.resolveLocalPath(filePath);
  }

  public async getDirectMediaUrlPublic(url: string): Promise<string> {
    return this.getDirectMediaUrl(url);
  }

  // ========== MÉTODOS PRIVADOS ==========

  private isLocalPath(url: string): boolean {
    return !url.startsWith('http://') && 
           !url.startsWith('https://') && 
           !url.startsWith('data:');
  }

  private isBase64Data(data: string): boolean {
    return data.startsWith('data:') && data.includes(';base64,');
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
      '.webp': 'image/webp'
    };
    
    return mimeTypes[ext] || 'image/jpeg';
  }

  private getMimeTypeFromUrl(url: string): string {
    const ext = path.extname(url.split('?')[0]).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    return mimeTypes[ext] || 'image/jpeg';
  }

  private async getDirectMediaUrl(url: string): Promise<string> {
    try {
      if (url.includes('raw.githubusercontent.com') || 
          url.includes('cdn.discordapp.com') ||
          url.includes('i.imgur.com') ||
          url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
        return url;
      }

      if (url.includes('github.com') && url.includes('/blob/')) {
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

  private async processBase64Sticker(base64Data: string): Promise<{ filePath: string; mimetype: string }> {
    return this.processBase64Media(base64Data, 'image');
  }

  private async processBase64Media(base64Data: string, expectedType: string): Promise<{ filePath: string; mimetype: string }> {
    try {
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Formato Base64 inválido');
      }

      const fullMimetype = matches[1];
      const base64String = matches[2];
      
      if (!fullMimetype.startsWith(expectedType)) {
        throw new Error(`Tipo de mídia esperado: ${expectedType}, recebido: ${fullMimetype}`);
      }

      const buffer = Buffer.from(base64String, 'base64');
      const extension = this.getExtensionFromMime(fullMimetype);
      const fileName = `${expectedType}_${Date.now()}.${extension}`;
      const filePath = path.join(tempDir, fileName);

      await fs.promises.writeFile(filePath, buffer);
      logger.info(`✅ ${expectedType} Base64 salvo: ${filePath}`);

      return {
        filePath,
        mimetype: fullMimetype
      };

    } catch (error: any) {
      logger.error(`❌ Erro ao processar ${expectedType} Base64: ${error.message}`);
      throw new Error(`Falha ao processar ${expectedType} Base64: ${error.message}`);
    }
  }

  private getExtensionFromMime(mimetype: string): string {
    const mimeToExt: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp'
    };
    
    return mimeToExt[mimetype] || 'jpg';
  }
}