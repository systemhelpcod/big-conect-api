// /root/api/big2/beta/api-big-conect/src/core/sessionManager.ts
import { BaileysClient } from './baileysClient';
import { ISession } from '../types';
import { generateSessionId } from '../utils/helpers';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export class SessionManager {
  private sessions: Map<string, { client: BaileysClient; session: ISession }> = new Map();
  private sessionsFile: string;

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
          
          // Tentar reconectar sessões que estavam conectadas
          if (session.status === 'connected' || session.status === 'connecting') {
            logger.info(`🔄 Tentando reconectar sessão: ${sessionId}`);
            client.initialize().catch(error => {
              logger.error(`❌ Falha ao reconectar sessão ${sessionId}:`, error);
              this.updateSessionStatus(sessionId, 'failed');
            });
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
      
      // Garantir que o diretório existe
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

  async createSession(): Promise<ISession> {
    const sessionId = generateSessionId();
    
    const session: ISession = {
      sessionId,
      isConnected: false,
      status: 'connecting',
      createdAt: new Date(),
      lastActivity: new Date()
    };

    const client = new BaileysClient(sessionId);
    
    this.sessions.set(sessionId, { client, session });
    
    // Salvar sessões após criar nova
    this.saveSessions();

    // Initialize client asynchronously
    client.initialize().catch(error => {
      logger.error(`Error initializing session ${sessionId}:`, error);
      this.updateSessionStatus(sessionId, 'failed');
    });

    logger.info(`✅ Created new session: ${sessionId}`);
    return session;
  }

  getSession(sessionId: string): { client: BaileysClient; session: ISession } | undefined {
    const sessionData = this.sessions.get(sessionId);
    if (sessionData) {
      sessionData.session.lastActivity = new Date();
      // Atualizar status baseado na conexão do cliente
      sessionData.session.status = sessionData.client.isActive() ? 'connected' : 'disconnected';
      this.saveSessions(); // Salvar ao acessar
    }
    return sessionData;
  }

  getAllSessions(): ISession[] {
    const sessions = Array.from(this.sessions.values()).map(({ session, client }) => ({
      ...session,
      status: client.isActive() ? 'connected' : session.status
    }));
    
    // Ordenar por última atividade (mais recente primeiro)
    return sessions.sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
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
      this.saveSessions(); // Salvar após deletar
      
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
    if (!sessionData) {
      throw new Error('Session not found');
    }

    // Atualizar última atividade
    sessionData.session.lastActivity = new Date();
    this.saveSessions(); // Salvar ao enviar mensagem

    return await sessionData.client.sendMessage(to, content);
  }

  // Método para atualizar o status de uma sessão
  updateSessionStatus(sessionId: string, status: ISession['status']): void {
    const sessionData = this.sessions.get(sessionId);
    if (sessionData) {
      sessionData.session.status = status;
      sessionData.session.lastActivity = new Date();
      sessionData.session.isConnected = status === 'connected';
      this.saveSessions();
    }
  }

  // Método para obter estatísticas das sessões
  getSessionStats() {
    const sessions = Array.from(this.sessions.values());
    return {
      total: sessions.length,
      connected: sessions.filter(({ client }) => client.isActive()).length,
      connecting: sessions.filter(({ session }) => session.status === 'connecting').length,
      disconnected: sessions.filter(({ session }) => session.status === 'disconnected').length,
      failed: sessions.filter(({ session }) => session.status === 'failed').length
    };
  }

  // Método para limpar sessões inativas
  cleanupInactiveSessions(maxAgeMinutes: number = 60): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, { session, client }] of this.sessions.entries()) {
      const ageInMinutes = (now.getTime() - session.lastActivity.getTime()) / (1000 * 60);
      
      if (ageInMinutes > maxAgeMinutes && !client.isActive()) {
        this.sessions.delete(sessionId);
        cleanedCount++;
        logger.info(`🧹 Cleaned up inactive session: ${sessionId} (age: ${ageInMinutes.toFixed(2)} minutes)`);
      }
    }

    if (cleanedCount > 0) {
      this.saveSessions();
    }

    return cleanedCount;
  }

  // Método para forçar salvamento das sessões
  forceSave(): void {
    this.saveSessions();
    logger.info(`💾 Sessões forçadas a salvar: ${this.sessions.size}`);
  }
}

export const sessionManager = new SessionManager();