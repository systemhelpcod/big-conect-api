// /root/api/big2/beta/api-big-conect/src/controllers/messageDocumentController.ts
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { sessionManager } from '../core/sessionManager';
import { IApiResponse } from '../types';
import { logger } from '../utils/logger';
import { formatJid, isValidPhoneNumber } from '../utils/helpers';
import { AntiBanHelper } from '../utils/antiBanHelper';

export class MessageDocumentController {
  async sendDocument(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, mediaUrl, caption, fileName } = req.body;

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
        const documentResult = await this.processBase64Document(mediaUrl, fileName);
        messageContent = {
          document: { url: documentResult.filePath },
          caption: caption || '',
          fileName: documentResult.fileName,
          mimetype: documentResult.mimetype
        };
      } else if (this.isLocalPath(mediaUrl)) {
        const absolutePath = this.resolveLocalPath(mediaUrl);
        if (!fs.existsSync(absolutePath)) {
          throw new Error(`Arquivo de documento não encontrado: ${absolutePath}`);
        }
        messageContent = {
          document: { url: absolutePath },
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

      const result = await sessionManager.sendMessage(sessionId, jid, messageContent);

      const response: IApiResponse = {
        success: true,
        data: { 
          messageId: result.key.id,
          timestamp: new Date().toISOString(),
          type: 'document',
          isBase64: this.isBase64Data(mediaUrl),
          fileName: messageContent.fileName
        },
        message: 'Document sent successfully'
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error sending document:', error);
      
      const response: IApiResponse = {
        success: false,
        error: error.message || 'Failed to send document'
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
    
    return path.resolve(process.cwd(), filePath);
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private getMimeTypeFromUrl(url: string): string {
    const ext = path.extname(url.split('?')[0]).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private async getDirectMediaUrl(url: string): Promise<string> {
    try {
      if (url.includes('raw.githubusercontent.com') || 
          url.includes('cdn.discordapp.com') ||
          url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)(\?.*)?$/i)) {
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

  private async processBase64Document(base64Data: string, fileName?: string): Promise<{ filePath: string; fileName: string; mimetype: string }> {
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
      
      if (!fullMimetype.startsWith('application/') && !fullMimetype.startsWith('text/')) {
        throw new Error(`Tipo de mídia esperado: application ou text, recebido: ${fullMimetype}`);
      }

      const buffer = Buffer.from(base64String, 'base64');
      const extension = this.getExtensionFromMime(fullMimetype);
      const finalFileName = fileName || `document_${Date.now()}.${extension}`;
      const filePath = path.join(tempDir, finalFileName);

      await fs.promises.writeFile(filePath, buffer);
      logger.info(`✅ Documento Base64 salvo: ${filePath}`);

      return {
        filePath,
        fileName: finalFileName,
        mimetype: fullMimetype
      };

    } catch (error: any) {
      logger.error(`❌ Erro ao processar documento Base64: ${error.message}`);
      throw new Error(`Falha ao processar documento Base64: ${error.message}`);
    }
  }

  private getExtensionFromMime(mimetype: string): string {
    const mimeToExt: { [key: string]: string } = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'text/plain': 'txt',
      'application/zip': 'zip',
      'application/x-rar-compressed': 'rar'
    };
    
    return mimeToExt[mimetype] || 'bin';
  }
}