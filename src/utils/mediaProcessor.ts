// /root/api/big2/beta/api-big-conect/src/utils/mediaProcessor.ts
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { logger } from './logger';

export class MediaProcessor {
  isLocalPath(url: string): boolean {
    return !url.startsWith('http://') && 
           !url.startsWith('https://') && 
           !url.startsWith('data:');
  }

  isBase64Data(data: string): boolean {
    return data.startsWith('data:') && data.includes(';base64,');
  }

  resolveLocalPath(filePath: string, baseDir?: string): string {
    if (filePath.startsWith('./') || filePath.startsWith('../')) {
      return path.resolve(process.cwd(), filePath);
    }
    
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    
    if (baseDir) {
      return path.resolve(process.cwd(), baseDir, filePath);
    }
    
    return path.resolve(process.cwd(), filePath);
  }

  getMimeType(filePath: string): string {
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
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  getMimeTypeFromUrl(url: string): string {
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
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async getDirectMediaUrl(url: string): Promise<string> {
    try {
      if (url.includes('raw.githubusercontent.com') || 
          url.includes('cdn.discordapp.com') ||
          url.includes('i.imgur.com') ||
          url.match(/\.(jpg|jpeg|png|gif|webp|mp4|avi|mov|pdf)(\?.*)?$/i)) {
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

  async processBase64Image(base64Data: string): Promise<{ filePath: string; mimetype: string }> {
    return this.processBase64Media(base64Data, 'image');
  }

  async processBase64Video(base64Data: string): Promise<{ filePath: string; mimetype: string }> {
    return this.processBase64Media(base64Data, 'video');
  }

  async processBase64Document(base64Data: string, fileName?: string): Promise<{ filePath: string; fileName: string; mimetype: string }> {
    const result = await this.processBase64Media(base64Data, 'application');
    return {
      filePath: result.filePath,
      fileName: fileName || `document_${Date.now()}.pdf`,
      mimetype: result.mimetype
    };
  }

  async processBase64Sticker(base64Data: string): Promise<{ filePath: string; mimetype: string }> {
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
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/avi': 'avi',
      'video/quicktime': 'mov',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };
    
    return mimeToExt[mimetype] || 'bin';
  }
}