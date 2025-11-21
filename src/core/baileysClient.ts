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
    level: 'info' as const,
    
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

      // Enviar webhook de inicialização
      await this.sendWebhook('session', {
        event: 'SESSION_INITIALIZING',
        status: 'initializing',
        message: 'Starting WhatsApp session'
      });

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
      
      this.sock = makeWASocket(socketConfig as any);
      
      logger.info(`✅ Socket created successfully for session: ${this.sessionId}`);

      // Enviar webhook de socket criado
      await this.sendWebhook('session', {
        event: 'SOCKET_CREATED',
        status: 'connecting',
        message: 'WhatsApp socket created, waiting for connection'
      });

      // 6. Configurar handlers de eventos
      this.setupEventHandlers(saveCreds);

      // Notificar que está conectando
      if (this.onStatusChange) {
        this.onStatusChange('connecting');
      }

    } catch (error) {
      logger.error(`❌ Failed to initialize session ${this.sessionId}:`, error);
      
      // Enviar webhook de erro na inicialização
      await this.sendWebhook('session', {
        event: 'SESSION_INIT_FAILED',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to initialize WhatsApp session'
      });

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

  private async sendWebhook(type: 'session' | 'message' | 'status' | 'presence' | 'group', data: any): Promise<void> {
    try {
      await webhookHandler.send({
        type,
        sessionId: this.sessionId,
        data,
        timestamp: new Date()
      });
    } catch (error) {
      logger.warn(`⚠️ Failed to send webhook for ${type}:`, error);
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

      // Handler para atualizações de status de mensagens
      this.sock.ev.on('messages.update', async (updates: any[]) => {
        await this.handleMessageUpdates(updates);
      });

      // Handler para presença de usuários
      this.sock.ev.on('presence.update', async (update: any) => {
        await this.handlePresenceUpdate(update);
      });

      // Handler para atualizações de grupos
      this.sock.ev.on('groups.update', async (updates: any[]) => {
        await this.handleGroupUpdates(updates);
      });

      // Handler para contatos
      this.sock.ev.on('contacts.update', async (updates: any[]) => {
        await this.handleContactUpdates(updates);
      });

      logger.info(`✅ Event handlers configured for session: ${this.sessionId}`);

    } catch (error) {
      logger.error(`❌ Error setting up event handlers:`, error);
    }
  }

  private async handleConnectionUpdate(update: any): Promise<void> {
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
        
        await this.sendWebhook('session', {
          event: 'QR_CODE_GENERATED',
          status: 'awaiting_scan',
          qrCode: qr,
          message: 'Scan QR code to connect WhatsApp'
        });
      }

      // Conexão aberta
      if (connection === 'open') {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        logger.info(`✅ Session ${this.sessionId} connected successfully!`);
        
        await this.sendWebhook('session', {
          event: 'CONNECTED',
          status: 'connected',
          userAgent: this.userAgent,
          message: 'WhatsApp connected successfully',
          timestamp: new Date().toISOString()
        });
      }

      // Conexão fechada
      if (connection === 'close') {
        this.isConnected = false;
        
        const shouldReconnect = this.shouldReconnect(lastDisconnect);
        const disconnectReason = this.getDisconnectReason(lastDisconnect);
        
        logger.info(`🔴 Session ${this.sessionId} disconnected. Reconnect: ${shouldReconnect}`);
        
        await this.sendWebhook('session', {
          event: 'DISCONNECTED',
          status: 'disconnected',
          shouldReconnect,
          reason: disconnectReason,
          error: lastDisconnect?.error?.message,
          reconnectAttempt: this.reconnectAttempts,
          message: `WhatsApp disconnected: ${disconnectReason}`
        });

        if (shouldReconnect) {
          this.attemptReconnect();
        } else {
          await this.sendWebhook('session', {
            event: 'SESSION_ENDED',
            status: 'ended',
            reason: disconnectReason,
            message: 'WhatsApp session ended, manual reconnection required'
          });
        }
      }

      // Conexão conectando
      if (connection === 'connecting') {
        await this.sendWebhook('session', {
          event: 'CONNECTING',
          status: 'connecting',
          message: 'Connecting to WhatsApp servers...'
        });
      }

    } catch (error) {
      logger.error(`❌ Error handling connection update:`, error);
    }
  }

  private getDisconnectReason(lastDisconnect: any): string {
    if (!lastDisconnect?.error) return 'Unknown reason';
    
    try {
      const error = lastDisconnect.error as Boom;
      const statusCode = error?.output?.statusCode;
      
      switch (statusCode) {
        case DisconnectReason.loggedOut:
          return 'Logged out from another device';
        case DisconnectReason.connectionLost:
          return 'Connection lost';
        case DisconnectReason.connectionClosed:
          return 'Connection closed';
        case DisconnectReason.connectionReplaced:
          return 'Connection replaced by another session';
        case DisconnectReason.timedOut:
          return 'Connection timed out';
        case DisconnectReason.restartRequired:
          return 'Restart required';
        default:
          return `Error: ${statusCode}`;
      }
    } catch {
      return 'Unknown error';
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
      
      // Enviar webhook de tentativa de reconexão
      this.sendWebhook('session', {
        event: 'RECONNECT_ATTEMPT',
        status: 'reconnecting',
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
        delay: reconnectDelay,
        message: `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      });

      setTimeout(() => {
        this.initialize().catch(error => {
          logger.error(`❌ Reconnect attempt ${this.reconnectAttempts} failed:`, error);
        });
      }, reconnectDelay);
    } else {
      logger.error(`🚫 Max reconnect attempts (${this.maxReconnectAttempts}) reached`);
      
      this.sendWebhook('session', {
        event: 'MAX_RECONNECT_ATTEMPTS',
        status: 'failed',
        maxAttempts: this.maxReconnectAttempts,
        message: 'Maximum reconnection attempts reached'
      });
    }
  }

  private async handleIncomingMessages(data: any): Promise<void> {
    try {
      const { messages, type } = data;
      
      if (!messages || !Array.isArray(messages)) return;

      for (const message of messages) {
        // Processar todas as mensagens, incluindo as enviadas por nós
        await this.processIncomingMessage(message, type);
      }
    } catch (error) {
      logger.error(`❌ Error processing incoming messages:`, error);
    }
  }

  private async processIncomingMessage(message: any, type: string): Promise<void> {
    try {
      const isFromMe = message.key?.fromMe || false;
      const messageType = Object.keys(message.message || {})[0] || 'unknown';
      
      const messageData = {
        id: message.key?.id,
        from: message.key?.remoteJid,
        timestamp: new Date((message.messageTimestamp || Date.now() / 1000) * 1000),
        type: messageType,
        content: this.extractMessageContent(message),
        sender: {
          id: message.key?.participant || message.key?.remoteJid,
          name: message.pushName || 'Unknown',
          isFromMe
        },
        messageType: type // 'notify' ou 'append'
      };

      logger.info(`📩 New ${isFromMe ? 'outgoing' : 'incoming'} message from ${messageData.sender.name} in session ${this.sessionId}`);

      await this.sendWebhook('message', {
        event: isFromMe ? 'MESSAGE_SENT' : 'MESSAGE_RECEIVED',
        ...messageData
      });

    } catch (error) {
      logger.error(`❌ Error processing message:`, error);
    }
  }

  private async handleMessageUpdates(updates: any[]): Promise<void> {
    try {
      for (const update of updates) {
        const statusUpdate = {
          messageId: update.key?.id,
          from: update.key?.remoteJid,
          status: this.getMessageStatus(update),
          timestamp: new Date()
        };

        logger.info(`📊 Message status update: ${statusUpdate.status} for message ${statusUpdate.messageId}`);

        await this.sendWebhook('status', {
          event: 'MESSAGE_STATUS_UPDATE',
          ...statusUpdate
        });
      }
    } catch (error) {
      logger.error(`❌ Error handling message updates:`, error);
    }
  }

  private getMessageStatus(update: any): string {
    if (update.update?.messageStubType === 7) return 'read';
    if (update.update?.status) return update.update.status;
    return 'unknown';
  }

  private async handlePresenceUpdate(update: any): Promise<void> {
    try {
      const presenceData = {
        id: update.id,
        participant: update.participant,
        lastSeen: update.lastSeen ? new Date(update.lastSeen * 1000) : undefined,
        isOnline: update.lastKnownPresence === 'available',
        status: update.lastKnownPresence
      };

      await this.sendWebhook('presence', {
        event: 'PRESENCE_UPDATE',
        ...presenceData
      });

    } catch (error) {
      logger.debug(`⚠️ Error handling presence update:`, error);
    }
  }

  private async handleGroupUpdates(updates: any[]): Promise<void> {
    try {
      for (const update of updates) {
        await this.sendWebhook('group', {
          event: 'GROUP_UPDATE',
          groupId: update.id,
          subject: update.subject,
          description: update.description,
          participants: update.participants?.length,
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.debug(`⚠️ Error handling group updates:`, error);
    }
  }

  private async handleContactUpdates(updates: any[]): Promise<void> {
    try {
      for (const update of updates) {
        await this.sendWebhook('presence', {
          event: 'CONTACT_UPDATE',
          contactId: update.id,
          name: update.name,
          notify: update.notify,
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.debug(`⚠️ Error handling contact updates:`, error);
    }
  }

  private extractMessageContent(message: any): any {
    if (!message.message) return { type: 'unknown' };

    const messageType = Object.keys(message.message)[0];
    const messageContent = message.message[messageType];

    switch (messageType) {
      case 'conversation':
        return { 
          type: 'text',
          text: messageContent 
        };
      case 'imageMessage':
        return {
          type: 'image',
          text: messageContent?.caption,
          mediaUrl: messageContent?.url,
          mimetype: messageContent?.mimetype
        };
      case 'videoMessage':
        return {
          type: 'video',
          text: messageContent?.caption,
          mediaUrl: messageContent?.url,
          mimetype: messageContent?.mimetype,
          duration: messageContent?.seconds
        };
      case 'audioMessage':
        return { 
          type: 'audio',
          mediaUrl: messageContent?.url,
          mimetype: messageContent?.mimetype,
          duration: messageContent?.seconds,
          isVoiceNote: messageContent?.ptt
        };
      case 'documentMessage':
        return {
          type: 'document',
          text: messageContent?.caption,
          fileName: messageContent?.fileName,
          mediaUrl: messageContent?.url,
          mimetype: messageContent?.mimetype,
          fileSize: messageContent?.fileLength
        };
      case 'stickerMessage':
        return {
          type: 'sticker',
          mediaUrl: messageContent?.url,
          mimetype: messageContent?.mimetype
        };
      case 'buttonsResponseMessage':
        return {
          type: 'button_response',
          selectedButtonId: messageContent?.selectedButtonId,
          text: messageContent?.selectedDisplayText
        };
      case 'listResponseMessage':
        return {
          type: 'list_response',
          title: messageContent?.title,
          description: messageContent?.description,
          listType: messageContent?.listType
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

      // Enviar webhook de início do envio
      await this.sendWebhook('status', {
        event: 'MESSAGE_SENDING',
        to,
        messageType: content.text ? 'text' : 'media',
        timestamp: new Date()
      });

      const result = await this.sock.sendMessage(to, content);
      
      await AntiBanHelper.delay(1000);

      await this.sendWebhook('status', {
        event: 'MESSAGE_SENT',
        messageId: result.key?.id,
        to,
        timestamp: new Date(),
        message: 'Message sent successfully'
      });

      logger.info(`✅ Message sent successfully to ${to}`);

      return result;

    } catch (error) {
      logger.error(`❌ Failed to send message to ${to}:`, error);
      
      await this.sendWebhook('status', {
        event: 'MESSAGE_FAILED',
        to,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        message: 'Failed to send message'
      });

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
        await this.sendWebhook('session', {
          event: 'LOGGING_OUT',
          status: 'logging_out',
          message: 'Logging out from WhatsApp'
        });

        await this.sock.logout();
        this.isConnected = false;
        this.sock = null;
        logger.info(`✅ Session ${this.sessionId} logged out successfully`);
        
        await this.sendWebhook('session', {
          event: 'LOGGED_OUT',
          status: 'logged_out',
          message: 'Successfully logged out from WhatsApp'
        });

        // Notificar logout
        if (this.onStatusChange) {
          this.onStatusChange('close');
        }
      } catch (error) {
        logger.error(`❌ Error logging out:`, error);
        
        await this.sendWebhook('session', {
          event: 'LOGOUT_FAILED',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to logout from WhatsApp'
        });

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
    
    await this.sendWebhook('session', {
      event: 'MANUAL_RECONNECT',
      status: 'reconnecting',
      message: 'Manual reconnection requested'
    });

    if (this.sock) {
      await this.logout();
    }
    this.reconnectAttempts = 0;
    await this.initialize();
  }
}