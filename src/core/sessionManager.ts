import { BaileysClient } from './baileysClient';
import { ISession } from '../types';
import { generateSessionId } from '../utils/helpers';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export class SessionManager {
  private sessions: Map<string, { client: BaileysClient; session: ISession }> = new Map();
  private sessionsFile: string;
  private clienteCount: number = 0; // contador para nomes automáticos

  constructor() {
    this.sessionsFile = path.join(process.cwd(), 'sessions', 'active_sessions.json');
    this.loadSessions();
  }

  private async loadSessions(): Promise<void> {
    try {
      if (fs.existsSync(this.sessionsFile)) {
        const data = fs.readFileSync(this.sessionsFile, 'utf8');
        const savedSessions = JSON.parse(data);

        for (const [sessionId, sessionData] of Object.entries(savedSessions)) {
          const session = sessionData as ISession;
          const client = new BaileysClient(sessionId);

          this.sessions.set(sessionId, { client, session });

          if (session.status === 'connected' || session.status === 'connecting') {
            logger.info(`🔄 Tentando reconectar sessão: ${sessionId}`);
            client.initialize().catch(error => {
              logger.error(`❌ Falha ao reconectar sessão ${sessionId}:`, error);
              this.updateSessionStatus(sessionId, 'failed');
            });
          }

          // Atualizar contador baseado em sessões existentes
          if (session.user?.name?.startsWith('Cliente ')) {
            const match = session.user.name.match(/Cliente (\d+)/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > this.clienteCount) this.clienteCount = num;
            }
          }
        }

        logger.info(`✅ ${this.sessions.size} sessões carregadas do arquivo`);
      }
    } catch (error) {
      logger.error('❌ Erro ao carregar sessões:', error);
    }
  }

  private saveSessions(): void {
    try {
      const sessionsData: { [key: string]: ISession } = {};

      for (const [sessionId, { session }] of this.sessions.entries()) {
        sessionsData[sessionId] = session;
      }

      const sessionsDir = path.dirname(this.sessionsFile);
      if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir, { recursive: true });
      }

      fs.writeFileSync(this.sessionsFile, JSON.stringify(sessionsData, null, 2));
      logger.debug(`💾 Sessões salvas: ${Object.keys(sessionsData).length}`);
    } catch (error) {
      logger.error('❌ Erro ao salvar sessões:', error);
    }
  }

  /**
   * Cria uma nova sessão.
   * @param deviceName Nome do dispositivo (opcional)
   * @param name Nome amigável da sessão (opcional)
   */
  async createSession(deviceName?: string, name?: string): Promise<ISession> {
    const sessionId = generateSessionId();

    // Se não tiver name, gera automaticamente Cliente 1, 2, 3...
    this.clienteCount += 1;
    let sessionName = name?.trim() || `Cliente ${this.clienteCount}`;

    // Se houver deviceName, adiciona junto no nome
    if (deviceName?.trim()) {
      sessionName += ` (${deviceName.trim()})`;
    }

    const session: ISession = {
      sessionId,
      isConnected: false,
      status: 'connecting',
      createdAt: new Date(),
      lastActivity: new Date(),
      user: {
        id: sessionId,
        name: sessionName
      }
    };

    const client = new BaileysClient(sessionId);
    this.sessions.set(sessionId, { client, session });
    this.saveSessions();

    client.initialize().catch(error => {
      logger.error(`Error initializing session ${sessionId}:`, error);
      this.updateSessionStatus(sessionId, 'failed');
    });

    logger.info(`✅ Created new session: ${sessionId} (${sessionName})`);
    return session;
  }

  getSession(sessionId: string): { client: BaileysClient; session: ISession } | undefined {
    const sessionData = this.sessions.get(sessionId);
    if (sessionData) {
      sessionData.session.lastActivity = new Date();
      sessionData.session.status = sessionData.client.isActive() ? 'connected' : 'disconnected';
      this.saveSessions();
    }
    return sessionData;
  }

  getAllSessions(): ISession[] {
    return Array.from(this.sessions.values())
      .map(({ session, client }) => ({
        ...session,
        status: client.isActive() ? 'connected' : session.status
      }))
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const sessionData = this.sessions.get(sessionId);
    if (sessionData) {
      try {
        await sessionData.client.logout();
        sessionData.session.status = 'disconnected';
      } catch (error) {
        logger.error(`Error logging out session ${sessionId}:`, error);
        sessionData.session.status = 'failed';
      }
      this.sessions.delete(sessionId);
      this.saveSessions();
      logger.info(`🗑️ Deleted session: ${sessionId}`);
      return true;
    }
    return false;
  }

  async getSessionQRCode(sessionId: string): Promise<string | null> {
    const sessionData = this.getSession(sessionId);
    if (sessionData) {
      return await sessionData.client.getQRCode();
    }
    return null;
  }

  async sendMessage(sessionId: string, to: string, content: any) {
    const sessionData = this.getSession(sessionId);
    if (!sessionData) throw new Error('Session not found');

    sessionData.session.lastActivity = new Date();
    this.saveSessions();
    return await sessionData.client.sendMessage(to, content);
  }

  updateSessionStatus(sessionId: string, status: ISession['status']): void {
    const sessionData = this.sessions.get(sessionId);
    if (sessionData) {
      sessionData.session.status = status;
      sessionData.session.lastActivity = new Date();
      sessionData.session.isConnected = status === 'connected';
      this.saveSessions();
    }
  }
}

export const sessionManager = new SessionManager();
