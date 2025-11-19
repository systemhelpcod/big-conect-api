// /root/api/big2/beta/api-big-conect/src/utils/fileUploadHelper.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { logger } from './logger';

export class FileUploadHelper {
  private static uploadDir = './uploads';

  // Configurar storage para multer
  static getStorage() {
    // Criar diretório de uploads se não existir
    fs.ensureDirSync(this.uploadDir);

    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
      }
    });
  }

  // Filtro de arquivos
  static fileFilter(req: any, file: any, cb: any) {
    const allowedMimes = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/3gpp': '3gp',
      'video/quicktime': 'mov',
      'audio/mpeg': 'mp3',
      'audio/mp4': 'm4a',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };

    if (allowedMimes[file.mimetype as keyof typeof allowedMimes]) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`), false);
    }
  }

  // Configuração do multer
  static getUploadMiddleware() {
    return multer({
      storage: this.getStorage(),
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
      }
    });
  }

  // Gerar URL local para arquivo
  static getLocalFileUrl(filename: string): string {
    return `file://${path.resolve(this.uploadDir, filename)}`;
  }

  // Limpar arquivos temporários
  static async cleanupFile(filename: string): Promise<void> {
    try {
      const filePath = path.resolve(this.uploadDir, filename);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        logger.debug(`Arquivo temporário removido: ${filename}`);
      }
    } catch (error) {
      logger.error(`Erro ao remover arquivo temporário: ${filename}`, error);
    }
  }

  // Ler arquivo como buffer (para áudio)
  static async readFileAsBuffer(filename: string): Promise<Buffer> {
    const filePath = path.resolve(this.uploadDir, filename);
    return await fs.readFile(filePath);
  }

  // Verificar se é URL
  static isUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }
}