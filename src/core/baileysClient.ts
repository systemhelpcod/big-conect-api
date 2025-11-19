// /root/api/big2/beta/api-big-conect/src/core/baileysClient.ts
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  fetchLatestBaileysVersion
} from 'whaileys';
import { Boom } from '@hapi/boom';
import { logger } from '../utils/logger';
import { ENV } from '../config/env';
import { webhookHandler } from '../webhook/webhookHandler';
import { UserAgentHelper } from '../utils/userAgentHelper';
import { AntiBanHelper } from '../utils/antiBanHelper';

// Criar um logger compatível com Baileys usando o pino
function createBaileysCompatibleLogger(sessionId: string) {
  const sessionLogger = logger.child({ sessionId, module: 'baileys' });
  
  return {
    // Propriedades básicas
    level: 'info' as const,
    
    // Métodos de logging
    trace: (obj: any, msg?: string, ...args: any[]) => {
      if (typeof obj === 'string') {
        sessionLogger.trace({ msg: obj }, msg, ...args);
      } else {
        sessionLogger.trace(obj, msg, ...args);
      }
    },
    debug: (obj: any, msg?: string, ...args: any[]) => {
      if (typeof obj === 'string') {
        sessionLogger.debug({ msg: obj }, msg, ...args);
      } else {
        sessionLogger.debug(obj, msg, ...args);
      }
    },
    info: (obj: any, msg?: string, ...args: any[]) => {
      if (typeof obj === 'string') {
        sessionLogger.info({ msg: obj }, msg, ...args);
      } else {
        sessionLogger.info(obj, msg, ...args);
      }
    },
    warn: (obj: any, msg?: string, ...args: any[]) => {
      if (typeof obj === 'string') {
        sessionLogger.warn({ msg: obj }, msg, ...args);
      } else {
        sessionLogger.warn(obj, msg, ...args);
      }
    },
    error: (obj: any, msg?: string, ...args: any[]) => {
      if (typeof obj === 'string') {
        sessionLogger.error({ msg: obj }, msg, ...args);
      } else {
        sessionLogger.error(obj, msg, ...args);
      }
    },
    fatal: (obj: any, msg?: string, ...args: any[]) => {
      if (typeof obj === 'string') {
        sessionLogger.fatal({ msg: obj }, msg, ...args);
      } else {
        sessionLogger.fatal(obj, msg, ...args);
      }
    },
    silent: (obj: any, msg?: string, ...args: any[]) => {
      // Não fazer nada - silent mode
    },
    
    // Propriedades extras que o Baileys pode precisar
    child: (bindings: any) => createBaileysCompatibleLogger(sessionId),
    
    // Propriedades para compatibilidade
    version: '1.0.0',
    levels: {
      values: {
        trace: 10,
        debug: 20,
        info: 30,
        warn: 40,
        error: 50,
        fatal: 60,
        silent: 100
      },
      labels: {
        10: 'trace',
        20: 'debug',
        30: 'info',
        40: 'warn',
        50: 'error',
        60: 'fatal',
        100: 'silent'
      }
    },
    useLevelLabels: true,
    customLevels: {},
    changeLevelName: undefined,
    changeLevel: undefined,
    useOnlyCustomLevels: false,
    redact: [],
    serializers: {},
    formatters: {
      level: (label: string, number: number) => ({ level: label }),
      bindings: (bindings: any) => bindings,
      log: (obj: any) => obj
    },
    base: null,
    enabled: true,
    name: 'baileys-logger',
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    messageKey: 'msg',
    errorKey: 'err',
    nestedKey: 'nested',
    useLevelLabelsFlag: true,
    mixin: () => ({}),
    mixinMergeStrategy: 'merge',
    quiet: false,
    depth: null,
    extreme: false,
    onChild: undefined,
    onTerminated: undefined
  };
}

export class BaileysClient {
  private sock: any = null;
  private sessionId: string;
  private isConnected: boolean = false;
  private qrCode: string = '';
  private userAgent: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private onStatusChange?: (status: string) => void;

  constructor(sessionId: string, onStatusChange?: (status: string) => void) {
    this.sessionId = sessionId;
    this.userAgent = UserAgentHelper.getWhatsAppCompatibleUserAgent();
    this.onStatusChange = onStatusChange;
  }

  async initialize(): Promise<void> {
    try {
      await AntiBanHelper.delay(1000);

      logger.info(`🚀 Initializing WhatsApp session: ${this.sessionId}`);

      // 1. Configurar estado de autenticação
      const { state, saveCreds } = await useMultiFileAuthState(
        `${ENV.PATCH_TOKENS}/${this.sessionId}`
      );

      logger.info(`✅ Auth state loaded for session: ${this.sessionId}`);

      // 2. Obter versão mais recente do WhatsApp
      const { version } = await fetchLatestBaileysVersion();
      logger.info(`📱 Using WhatsApp version: ${version[0]}.${version[1]}.${version[2]}`);

      // 3. Configuração básica do navegador
      const browserConfig = Browsers.ubuntu('Chrome');

      // 4. Criar logger compatível
      const baileysLogger = createBaileysCompatibleLogger(this.sessionId);

      // 5. Configuração mínima do socket
      const socketConfig = {
        version,
        auth: state,
        printQRInTerminal: ENV.VIEW_QRCODE_TERMINAL,
        browser: browserConfig,
        logger: baileysLogger,
        markOnlineOnConnect: false,
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 2000,
        getMessage: async () => undefined,
      };

      logger.info(`🔌 Creating WhatsApp socket...`);
      
      // Usar any para evitar problemas de tipagem
      this.sock = makeWASocket(socketConfig as any);
      
      logger.info(`✅ Socket created successfully for session: ${this.sessionId}`);

      // 6. Configurar handlers de eventos
      this.setupEventHandlers(saveCreds);

      // Notificar que está conectando
      if (this.onStatusChange) {
        this.onStatusChange('connecting');
      }

    } catch (error) {
      logger.error(`❌ Failed to initialize session ${this.sessionId}:`, error);
      if (error instanceof Error) {
        logger.error(`📋 Error message: ${error.message}`);
      }
      
      // Notificar falha
      if (this.onStatusChange) {
        this.onStatusChange('close');
      }
      
      throw error;
    }
  }

  private setupEventHandlers(saveCreds: () => void): void {
    if (!this.sock) {
      logger.error('❌ Socket is null, cannot setup event handlers');
      return;
    }

    try {
      // Atualizar credenciais quando necessário
      this.sock.ev.on('creds.update', saveCreds);

      // Handler para atualizações de conexão
      this.sock.ev.on('connection.update', (update: any) => {
        this.handleConnectionUpdate(update);
      });

      // Handler para mensagens recebidas
      this.sock.ev.on('messages.upsert', async (data: any) => {
        await this.handleIncomingMessages(data);
      });

      logger.info(`✅ Event handlers configured for session: ${this.sessionId}`);

    } catch (error) {
      logger.error(`❌ Error setting up event handlers:`, error);
    }
  }

  private handleConnectionUpdate(update: any): void {
    try {
      const { connection, lastDisconnect, qr } = update;

      logger.info(`📡 Connection update: ${connection} for session ${this.sessionId}`);

      // Notificar mudança de status
      if (this.onStatusChange) {
        this.onStatusChange(connection || 'connecting');
      }

      // QR Code gerado
      if (qr) {
        this.qrCode = qr;
        logger.info(`📱 QR Code generated for session: ${this.sessionId}`);
        
        webhookHandler.send({
          type: 'session',
          sessionId: this.sessionId,
          data: { 
            qrCode: qr, 
            status: 'QR_CODE_GENERATED',
            message: 'Scan QR code to connect'
          },
          timestamp: new Date()
        });
      }

      // Conexão aberta
      if (connection === 'open') {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        logger.info(`✅ Session ${this.sessionId} connected successfully!`);
        
        webhookHandler.send({
          type: 'session',
          sessionId: this.sessionId,
          data: { 
            status: 'CONNECTED', 
            userAgent: this.userAgent,
            message: 'WhatsApp connected successfully'
          },
          timestamp: new Date()
        });
      }

      // Conexão fechada
      if (connection === 'close') {
        this.isConnected = false;
        
        const shouldReconnect = this.shouldReconnect(lastDisconnect);
        
        logger.info(`🔴 Session ${this.sessionId} disconnected. Reconnect: ${shouldReconnect}`);
        
        webhookHandler.send({
          type: 'session',
          sessionId: this.sessionId,
          data: { 
            status: 'DISCONNECTED',
            shouldReconnect,
            error: lastDisconnect?.error?.message,
            reconnectAttempt: this.reconnectAttempts
          },
          timestamp: new Date()
        });

        if (shouldReconnect) {
          this.attemptReconnect();
        }
      }

    } catch (error) {
      logger.error(`❌ Error handling connection update:`, error);
    }
  }

  private shouldReconnect(lastDisconnect: any): boolean {
    if (!lastDisconnect?.error) return true;
    
    try {
      const error = lastDisconnect.error as Boom;
      return error?.output?.statusCode !== DisconnectReason.loggedOut;
    } catch {
      return true;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const reconnectDelay = Math.min(30000, this.reconnectAttempts * 5000);
      
      logger.info(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${reconnectDelay}ms`);
      
      setTimeout(() => {
        this.initialize().catch(error => {
          logger.error(`❌ Reconnect attempt ${this.reconnectAttempts} failed:`, error);
        });
      }, reconnectDelay);
    } else {
      logger.error(`🚫 Max reconnect attempts (${this.maxReconnectAttempts}) reached`);
    }
  }

  private async handleIncomingMessages(data: any): Promise<void> {
    try {
      const { messages } = data;
      
      if (!messages || !Array.isArray(messages)) return;

      for (const message of messages) {
        if (!message.key?.fromMe && message.message) {
          await this.processIncomingMessage(message);
        }
      }
    } catch (error) {
      logger.error(`❌ Error processing incoming messages:`, error);
    }
  }

  private async processIncomingMessage(message: any): Promise<void> {
    try {
      const messageData = {
        id: message.key?.id,
        from: message.key?.remoteJid,
        timestamp: new Date((message.messageTimestamp || Date.now() / 1000) * 1000),
        type: Object.keys(message.message || {})[0] || 'unknown',
        content: this.extractMessageContent(message),
        sender: {
          id: message.key?.participant || message.key?.remoteJid,
          name: message.pushName || 'Unknown'
        }
      };

      logger.info(`📩 New message from ${messageData.sender.name} in session ${this.sessionId}`);

      webhookHandler.send({
        type: 'message',
        sessionId: this.sessionId,
        data: messageData,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error(`❌ Error processing message:`, error);
    }
  }

  private extractMessageContent(message: any): any {
    if (!message.message) return { type: 'unknown' };

    const messageType = Object.keys(message.message)[0];
    const messageContent = message.message[messageType];

    switch (messageType) {
      case 'conversation':
        return { text: messageContent };
      case 'imageMessage':
        return {
          text: messageContent?.caption,
          media: { type: 'image', url: messageContent?.url }
        };
      case 'videoMessage':
        return {
          text: messageContent?.caption,
          media: { type: 'video', url: messageContent?.url }
        };
      case 'audioMessage':
        return { media: { type: 'audio', url: messageContent?.url } };
      case 'documentMessage':
        return {
          text: messageContent?.caption,
          media: { type: 'document', fileName: messageContent?.fileName, url: messageContent?.url }
        };
      default:
        return { type: messageType };
    }
  }

  async sendMessage(to: string, content: any): Promise<any> {
    if (!this.isConnected || !this.sock) {
      throw new Error('❌ Session not connected');
    }

    try {
      const canSend = AntiBanHelper.canSendMessage(this.sessionId);
      if (!canSend.allowed) {
        throw new Error(`🚫 Message limit exceeded: ${canSend.reason}`);
      }

      await AntiBanHelper.messageCooldown(this.sessionId);
      await AntiBanHelper.simulateHumanBehavior();

      logger.info(`📤 Sending message to ${to} from session ${this.sessionId}`);

      const result = await this.sock.sendMessage(to, content);
      
      await AntiBanHelper.delay(1000);

      webhookHandler.send({
        type: 'status',
        sessionId: this.sessionId,
        data: {
          event: 'MESSAGE_SENT',
          messageId: result.key?.id,
          to,
          timestamp: new Date()
        },
        timestamp: new Date()
      });

      logger.info(`✅ Message sent successfully to ${to}`);

      return result;

    } catch (error) {
      logger.error(`❌ Failed to send message to ${to}:`, error);
      await AntiBanHelper.delay(3000);
      throw error;
    }
  }

  async getQRCode(): Promise<string> {
    return this.qrCode;
  }

  async getStatus(): Promise<any> {
    return {
      sessionId: this.sessionId,
      isConnected: this.isConnected,
      qrCode: this.qrCode ? 'Available' : 'Not available',
      userAgent: this.userAgent,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      status: this.isConnected ? 'connected' : 'disconnected'
    };
  }

  async logout(): Promise<void> {
    if (this.sock) {
      try {
        await this.sock.logout();
        this.isConnected = false;
        this.sock = null;
        logger.info(`✅ Session ${this.sessionId} logged out successfully`);
        
        // Notificar logout
        if (this.onStatusChange) {
          this.onStatusChange('close');
        }
      } catch (error) {
        logger.error(`❌ Error logging out:`, error);
        this.isConnected = false;
        this.sock = null;
      }
    }
  }

  isActive(): boolean {
    return this.isConnected && this.sock !== null;
  }

  async reconnect(): Promise<void> {
    logger.info(`🔄 Manual reconnect requested for session ${this.sessionId}`);
    if (this.sock) {
      await this.logout();
    }
    this.reconnectAttempts = 0;
    await this.initialize();
  }
}