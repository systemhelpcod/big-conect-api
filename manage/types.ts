export interface SessionRaw {
  sessionId: string;
  status: string;
  isConnected: boolean;
  lastActivity: string | number;
  battery?: number;
  pushName?: string;
}

export interface SessionUI {
  id: string;
  name: string;
  status: 'Conectado' | 'QR Scan' | 'Desconectado';
  statusRaw: string;
  lastActivity: string;
  battery?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  response?: T; // Handling variations in API structure
  message?: string;
  error?: string;
}

export interface ConnectionConfig {
  host: string;
  apiKey: string;
}

export enum AppState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD'
}