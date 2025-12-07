import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

export interface ISessionConfig {
  webhook?: string;
}

export class SessionConfig {
  static basePath = path.join(process.cwd(), 'sessions');

  static getConfigFile(sessionId: string): string {
    return path.join(this.basePath, sessionId, 'config.json');
  }

  static load(sessionId: string): ISessionConfig {
    try {
      const cfgFile = this.getConfigFile(sessionId);
      if (!fs.existsSync(cfgFile)) return {};

      return JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
    } catch (error: any) {
      logger.error(`Erro ao ler config da sessão ${sessionId}: ${error.message}`);
      return {};
    }
  }

  static save(sessionId: string, config: ISessionConfig): boolean {
    try {
      const folder = path.join(this.basePath, sessionId);
      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

      fs.writeFileSync(
        this.getConfigFile(sessionId),
        JSON.stringify(config, null, 2)
      );

      return true;
    } catch (error: any) {
      logger.error(`Erro ao salvar config da sessão ${sessionId}: ${error.message}`);
      return false;
    }
  }
}
