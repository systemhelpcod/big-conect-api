// /root/api/big2/beta/api-big-conect/src/controllers/messageVideoController.ts
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { sessionManager } from '../core/sessionManager';
import { IApiResponse } from '../types';
import { logger } from '../utils/logger';
import { formatJid, isValidPhoneNumber } from '../utils/helpers';
import { AntiBanHelper } from '../utils/antiBanHelper';

export class MessageVideoController {
  async sendVideo(req: Request, res: Response) {
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

      if (this.isBase64Data(mediaUrl)) {
        const videoResult = await this.processBase64Video(mediaUrl);
        messageContent = {
          video: { url: videoResult.filePath },
          caption: caption || '',
          mimetype: videoResult.mimetype
        };
      } else if (this.isLocalPath(mediaUrl)) {
        const absolutePath = this.resolveLocalPath(mediaUrl);
        if (!fs.existsSync(absolutePath)) {
          throw new Error(`Arquivo de vídeo não encontrado: ${absolutePath}`);
        }
        messageContent = {
          video: { url: absolutePath },
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

      const result = await sessionManager.sendMessage(sessionId, jid, messageContent);

      const response: IApiResponse = {
        success: true,
        data: { 
          messageId: result.key.id,
          timestamp: new Date().toISOString(),
          type: 'video',
          isBase64: this.isBase64Data(mediaUrl)
        },
        message: 'Video message sent successfully'
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error sending video message:', error);
      
      const response: IApiResponse = {
        success: false,
        error: error.message || 'Failed to send video message'
      };
      
      res.status(500).json(response);
    }
  }

  // ========== HELPER METHODS ==========

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
    
    return path.resolve(process.cwd(), 'video-exemplo', filePath);
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.webm': 'video/webm'
    };
    
    return mimeTypes[ext] || 'video/mp4';
  }

  private getMimeTypeFromUrl(url: string): string {
    const ext = path.extname(url.split('?')[0]).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.webm': 'video/webm'
    };
    
    return mimeTypes[ext] || 'video/mp4';
  }

  private async getDirectMediaUrl(url: string): Promise<string> {
    try {
      if (url.includes('raw.githubusercontent.com') || 
          url.includes('cdn.discordapp.com') ||
          url.includes('i.imgur.com') ||
          url.match(/\.(mp4|avi|mov|mkv|webm)(\?.*)?$/i)) {
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

  private async processBase64Video(base64Data: string): Promise<{ filePath: string; mimetype: string }> {
    try {
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const matches = base64Data.match(/^data:video\/([^;]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Formato Base64 inválido para vídeo');
      }

      const fullMimetype = `video/${matches[1]}`;
      const base64String = matches[2];
      
      if (!fullMimetype.startsWith('video/')) {
        throw new Error(`Tipo de mídia esperado: video, recebido: ${fullMimetype}`);
      }

      const buffer = Buffer.from(base64String, 'base64');
      const extension = this.getExtensionFromMime(fullMimetype);
      const fileName = `video_${Date.now()}.${extension}`;
      const filePath = path.join(tempDir, fileName);

      await fs.promises.writeFile(filePath, buffer);
      logger.info(`✅ Vídeo Base64 salvo: ${filePath}`);

      return {
        filePath,
        mimetype: fullMimetype
      };

    } catch (error: any) {
      logger.error(`❌ Erro ao processar vídeo Base64: ${error.message}`);
      throw new Error(`Falha ao processar vídeo Base64: ${error.message}`);
    }
  }

  private getExtensionFromMime(mimetype: string): string {
    const mimeToExt: { [key: string]: string } = {
      'video/mp4': 'mp4',
      'video/x-msvideo': 'avi',
      'video/quicktime': 'mov',
      'video/x-matroska': 'mkv',
      'video/webm': 'webm'
    };
    
    return mimeToExt[mimetype] || 'mp4';
  }
}