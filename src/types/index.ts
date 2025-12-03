export interface IUser {
  id: string;
  name?: string;
  phone?: string;
}

export interface ISession {
  sessionId: string;
  name?: string; // nome amigável da sessão
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
  qrCode?: string;
  user?: IUser;
  deviceName?: string; // nome do dispositivo opcional
  deviceInfo?: {
    userAgent: string;
    browser: string;
    platform: string;
  };
  createdAt: Date;
  lastActivity: Date;
}

export interface IMessage {
  to: string;
  text?: string;
  media?: {
    url: string;
    type: 'image' | 'video' | 'document' | 'audio' | 'sticker';
    caption?: string;
    fileName?: string;
    mimetype?: string;
  };
  buttons?: Array<{
    id: string;
    text: string;
  }>;
  template?: any;
  list?: {
    title: string;
    text: string;
    buttonText: string;
    sections: Array<{
      title: string;
      rows: Array<{
        title: string;
        description?: string;
        rowId: string;
      }>;
    }>;
  };
  reaction?: {
    messageId: string;
    emoji: string;
  };
}

export interface IWebhookEvent {
  type: 'message' | 'session' | 'status' | 'presence' | 'group';
  sessionId: string;
  data: any;
  timestamp: Date;
}

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface IMessageStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  recipient: string;
}

export interface IGroup {
  id: string;
  name: string;
  participants: Array<{
    id: string;
    isAdmin: boolean;
    isSuperAdmin: boolean;
  }>;
  createdAt: Date;
  createdBy: string;
}

export interface IContact {
  id: string;
  name?: string;
  pushName?: string;
  phone: string;
  isBusiness?: boolean;
  isEnterprise?: boolean;
}

export interface IPresence {
  id: string;
  participant: string;
  lastSeen?: Date;
  isOnline: boolean;
  status?: 'available' | 'composing' | 'recording' | 'paused';
}

export interface ISessionConfig {
  sessionId: string;
  userAgent?: string;
  browser?: string;
  platform?: string;
  webhookUrl?: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  qrTimeout?: number;
}

export interface IBulkMessage {
  to: string;
  text?: string;
  media?: {
    url: string;
    type: 'image' | 'video' | 'document' | 'audio';
    caption?: string;
  };
  buttons?: Array<{
    id: string;
    text: string;
  }>;
  delay?: number;
}

export interface IBulkMessageResult {
  total: number;
  sent: number;
  failed: number;
  results: Array<{
    to: string;
    messageId?: string;
    status: 'sent' | 'failed';
    error?: string;
    timestamp: Date;
  }>;
}

export interface IAntiBanConfig {
  maxMessagesPerMinute: number;
  maxMessagesPerHour: number;
  maxMessagesPerDay: number;
  delayBetweenMessages: {
    min: number;
    max: number;
  };
  enableHumanBehavior: boolean;
  rotateUserAgents: boolean;
}

// Tipos para eventos do WhatsApp
export interface IWhatsAppEvent {
  type: 'message' | 'presence' | 'group' | 'connection';
  sessionId: string;
  data: any;
}

export interface IConnectionState {
  connection: 'open' | 'connecting' | 'close';
  lastDisconnect?: {
    error: any;
    date: Date;
  };
  qr?: string;
  isNewLogin?: boolean;
}

// Tipos para respostas de erro padronizadas
export interface IErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
}

// Tipos para sucesso padronizados
export interface ISuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}
