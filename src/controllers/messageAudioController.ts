// /root/api/big2/beta/api-big-conect/src/controllers/messageAudioController.ts
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { sessionManager } from '../core/sessionManager';
import { IApiResponse } from '../types';
import { logger } from '../utils/logger';
import { formatJid, isValidPhoneNumber } from '../utils/helpers';
import { AntiBanHelper } from '../utils/antiBanHelper';

export class MessageAudioController {
  async sendAudio(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { to, mediaUrl, caption, forceOpus = false, ptt = false } = req.body;

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
        const audioResult = await this.processBase64Audio(mediaUrl, forceOpus);
        messageContent = {
          audio: { url: audioResult.filePath },
          mimetype: audioResult.mimetype,
          ptt: ptt
        };
      } else if (this.isLocalPath(mediaUrl)) {
        const absolutePath = this.resolveLocalPath(mediaUrl);
        if (!fs.existsSync(absolutePath)) {
          throw new Error(`Arquivo de áudio não encontrado: ${absolutePath}`);
        }
        
        const audioResult = await this.processAudioFile(absolutePath, forceOpus);
        messageContent = {
          audio: { url: audioResult.filePath },
          mimetype: audioResult.mimetype,
          ptt: ptt
        };
      } else {
        try {
          const directUrl = await this.getDirectMediaUrl(mediaUrl);
          
          if (forceOpus) {
            logger.info('🔄 forceOpus ativado, convertendo áudio para OPUS...');
            const localAudioResult = await this.downloadAndConvertAudio(mediaUrl, true);
            messageContent = {
              audio: { url: localAudioResult.filePath },
              mimetype: localAudioResult.mimetype,
              ptt: ptt
            };
            logger.info(`✅ Áudio convertido para OPUS: ${localAudioResult.filePath}`);
          } else {
            messageContent = {
              audio: { url: directUrl },
              mimetype: this.getMimeTypeFromUrl(directUrl),
              ptt: ptt
            };
          }
        } catch (directError: unknown) {
          const errorMessage = directError instanceof Error ? directError.message : 'Erro desconhecido';
          logger.warn(`⚠️ Envio direto falhou, baixando e processando: ${errorMessage}`);
          const localAudioResult = await this.downloadAndConvertAudio(mediaUrl, forceOpus);
          messageContent = {
            audio: { url: localAudioResult.filePath },
            mimetype: localAudioResult.mimetype,
            ptt: ptt
          };
        }
      }

      const result = await sessionManager.sendMessage(sessionId, jid, messageContent);

      const additionalData: any = {
        messageId: result.key.id,
        timestamp: new Date().toISOString(),
        type: 'audio',
        isBase64: this.isBase64Data(mediaUrl),
        convertedToOpus: forceOpus,
        localFilePath: await this.getFinalAudioPath(mediaUrl, forceOpus)
      };

      const response: IApiResponse = {
        success: true,
        data: additionalData,
        message: 'Audio message sent successfully'
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error sending audio message:', error);
      
      const response: IApiResponse = {
        success: false,
        error: error.message || 'Failed to send audio message'
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
    
    return path.resolve(process.cwd(), 'audio-exemplo', filePath);
  }

  private getMimeTypeFromUrl(url: string): string {
    const ext = path.extname(url.split('?')[0]).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.oga': 'audio/ogg',
      '.opus': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac'
    };
    
    return mimeTypes[ext] || 'audio/mpeg';
  }

  private async getDirectMediaUrl(url: string): Promise<string> {
    try {
      if (url.includes('raw.githubusercontent.com') || 
          url.includes('cdn.discordapp.com') ||
          url.match(/\.(mp3|wav|ogg|oga|opus|m4a|aac)(\?.*)?$/i)) {
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

  private async processBase64Audio(base64Data: string, forceOpus: boolean): Promise<{ filePath: string; mimetype: string }> {
    try {
      logger.info('🎵 Processando áudio em Base64...');
      
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const matches = base64Data.match(/^data:audio\/([^;]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error('Formato Base64 inválido para áudio');
      }

      const originalMimetype = `audio/${matches[1]}`;
      const base64String = matches[2];
      const audioBuffer = Buffer.from(base64String, 'base64');

      const tempFileName = `audio_${Date.now()}.${this.getExtensionFromMime(originalMimetype)}`;
      const tempFilePath = path.join(tempDir, tempFileName);
      
      await fs.promises.writeFile(tempFilePath, audioBuffer);
      logger.info(`✅ Áudio Base64 salvo temporariamente: ${tempFilePath}`);

      if (forceOpus && !originalMimetype.includes('ogg')) {
        logger.info('🔄 Convertendo áudio Base64 para OPUS...');
        const opusFilePath = path.join(tempDir, `audio_${Date.now()}.opus`);
        
        try {
          await this.convertToWhatsAppOpus(tempFilePath, opusFilePath);
          
          if (fs.existsSync(opusFilePath) && fs.statSync(opusFilePath).size > 0) {
            this.cleanupTempFile(tempFilePath);
            logger.info(`✅ Áudio Base64 convertido para OPUS: ${opusFilePath}`);
            
            return {
              filePath: opusFilePath,
              mimetype: 'audio/ogg'
            };
          }
        } catch (conversionError: unknown) {
          const errorMessage = conversionError instanceof Error ? conversionError.message : 'Erro desconhecido';
          logger.warn(`❌ Conversão Base64 falhou, usando original: ${errorMessage}`);
        }
      }

      return {
        filePath: tempFilePath,
        mimetype: originalMimetype
      };

    } catch (error: any) {
      logger.error(`❌ Erro ao processar áudio Base64: ${error.message}`);
      throw new Error(`Falha ao processar áudio Base64: ${error.message}`);
    }
  }

  private getExtensionFromMime(mimetype: string): string {
    const mimeToExt: { [key: string]: string } = {
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/opus': 'opus',
      'audio/mp4': 'm4a',
      'audio/aac': 'aac'
    };
    
    return mimeToExt[mimetype] || 'mp3';
  }

  private async downloadAndConvertAudio(url: string, forceOpus: boolean): Promise<{ filePath: string; fileName: string; mimetype: string }> {
    try {
      logger.info(`🎵 Iniciando download e processamento de áudio: ${url}`);
      
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const fileNameFromUrl = this.getFileNameFromUrl(url);
      const baseName = path.basename(fileNameFromUrl, path.extname(fileNameFromUrl));
      
      const tempInputPath = path.join(tempDir, `temp_${Date.now()}_${baseName}${path.extname(url.split('?')[0]) || '.tmp'}`);
      const finalOutputPath = path.join(tempDir, `${baseName}.opus`);

      try {
        logger.info(`📥 Baixando áudio de: ${url}`);
        const response = await axios({
          method: 'GET',
          url: url,
          responseType: 'stream',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const writer = fs.createWriteStream(tempInputPath);
        response.data.pipe(writer);

        await new Promise<void>((resolve, reject) => {
          writer.on('finish', () => resolve());
          writer.on('error', (err) => reject(err));
        });

        const fileSize = fs.statSync(tempInputPath).size;
        if (fileSize === 0) {
          throw new Error('Arquivo baixado está vazio');
        }

        logger.info(`✅ Áudio baixado: ${tempInputPath} (${fileSize} bytes)`);

        let finalPath: string;
        let finalMimetype: string;

        if (forceOpus) {
          logger.info(`🔄 Convertendo para OPUS (container OGG): ${baseName}.opus`);
          try {
            await this.convertToWhatsAppOpus(tempInputPath, finalOutputPath);
            
            if (fs.existsSync(finalOutputPath) && fs.statSync(finalOutputPath).size > 0) {
              finalPath = finalOutputPath;
              finalMimetype = 'audio/ogg';
              const convertedSize = fs.statSync(finalOutputPath).size;
              logger.info(`✅ Conversão OPUS concluída: ${finalOutputPath} (${convertedSize} bytes)`);
              
              this.cleanupTempFile(tempInputPath);
            } else {
              throw new Error('Arquivo convertido está vazio');
            }
          } catch (conversionError: unknown) {
            const errorMessage = conversionError instanceof Error ? conversionError.message : 'Erro desconhecido';
            logger.warn(`❌ Conversão OPUS falhou, usando formato original: ${errorMessage}`);
            finalPath = tempInputPath;
            finalMimetype = this.getMimeTypeFromUrl(tempInputPath);
          }
        } else {
          finalPath = tempInputPath;
          finalMimetype = this.getMimeTypeFromUrl(tempInputPath);
        }

        return {
          filePath: finalPath,
          fileName: path.basename(finalPath),
          mimetype: finalMimetype
        };

      } catch (error) {
        this.cleanupTempFile(tempInputPath);
        this.cleanupTempFile(finalOutputPath);
        throw error;
      }

    } catch (error: any) {
      logger.error(`❌ Erro no processamento de áudio: ${error.message}`);
      throw new Error(`Falha ao processar áudio: ${error.message}`);
    }
  }

  private async convertToWhatsAppOpus(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const ffmpeg = require('fluent-ffmpeg');
        
        ffmpeg(inputPath)
          .audioCodec('libopus')
          .audioBitrate('24k')
          .audioFrequency(16000)
          .outputOptions([
            '-ac 1',
            '-ar 16000',
            '-vn',
            '-application voip',
            '-y',
            '-frame_duration 20',
            '-vbr on',
            '-compression_level 10'
          ])
          .output(outputPath)
          .on('start', (commandLine: string) => {
            logger.info(`🔧 FFmpeg WhatsApp OPUS: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
          })
          .on('progress', (progress: any) => {
            if (progress.percent) {
              logger.debug(`📊 Conversão: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', () => {
            if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
              logger.info(`✅ Conversão WhatsApp OPUS concluída: ${outputPath}`);
              resolve();
            } else {
              reject(new Error('Arquivo de saída vazio ou não criado'));
            }
          })
          .on('error', (err: Error) => {
            logger.error(`❌ Erro FFmpeg WhatsApp OPUS: ${err.message}`);
            reject(err);
          })
          .run();
      } catch (ffmpegError) {
        logger.error('❌ FFmpeg não disponível para conversão WhatsApp OPUS');
        reject(new Error('FFmpeg não disponível'));
      }
    });
  }

  private async processAudioFile(filePath: string, forceOpus: boolean): Promise<{ filePath: string; mimetype: string }> {
    try {
      logger.info(`🎵 Processando arquivo de áudio local: ${filePath}`);
      
      const originalMimetype = this.getMimeTypeFromUrl(filePath);

      if (!forceOpus || originalMimetype.includes('ogg') || path.extname(filePath).toLowerCase() === '.opus') {
        return {
          filePath: filePath,
          mimetype: originalMimetype
        };
      }

      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const baseName = path.basename(filePath, path.extname(filePath));
      const outputPath = path.join(tempDir, `${baseName}.opus`);

      try {
        await this.convertToWhatsAppOpus(filePath, outputPath);
        
        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
          logger.info(`✅ Áudio local convertido para WhatsApp OPUS: ${outputPath}`);
          return {
            filePath: outputPath,
            mimetype: 'audio/ogg'
          };
        } else {
          throw new Error('Conversão falhou - arquivo de saída vazio');
        }
      } catch (conversionError: unknown) {
        const errorMessage = conversionError instanceof Error ? conversionError.message : 'Erro desconhecido';
        logger.warn(`⚠️ Conversão local falhou, usando original: ${errorMessage}`);
        return {
          filePath: filePath,
          mimetype: originalMimetype
        };
      }

    } catch (error: any) {
      logger.error(`❌ Erro ao processar arquivo de áudio local: ${error.message}`);
      throw new Error(`Falha ao processar áudio local: ${error.message}`);
    }
  }

  private getFileNameFromUrl(url: string): string {
    try {
      const cleanUrl = url.split('?')[0];
      const fileName = path.basename(cleanUrl);
      
      if (!path.extname(fileName)) {
        return `${fileName}.mp3`;
      }
      
      return fileName;
    } catch (error) {
      return `audio_${Date.now()}.mp3`;
    }
  }

  private async getFinalAudioPath(url: string, forceOpus: boolean): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp');
    const fileNameFromUrl = this.getFileNameFromUrl(url);
    const baseName = path.basename(fileNameFromUrl, path.extname(fileNameFromUrl));
    
    if (forceOpus) {
      return path.join(tempDir, `${baseName}.opus`);
    } else {
      return path.join(tempDir, fileNameFromUrl);
    }
  }

  private cleanupTempFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        logger.debug(`🧹 Arquivo temporário removido: ${filePath}`);
      } catch (error) {
        logger.warn(`⚠️ Não foi possível remover arquivo temporário: ${filePath}`);
      }
    }
  }
}