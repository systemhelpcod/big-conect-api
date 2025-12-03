
export interface SessionRaw {
  sessionId: string;
  status: string;
  isConnected: boolean;
  lastActivity: string | number;
  battery?: number;
  pushName?: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface SessionUI {
  id: string;
  name: string;
  status: 'Conectado' | 'QR Scan' | 'Desconectado';
  statusRaw: string;
  lastActivity: string;
  battery?: number;
  isDeleting?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  response?: T;
  message?: string;
  error?: string;
  qr?: string;
  version?: string;
}

export interface ConnectionConfig {
  host: string;
  apiKey: string;
}

export enum AppState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD'
}

export type ViewType = 'sessions' | 'api_config' | 'webhooks' | 'automations' | 'settings';

export interface UserSettings {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoRefresh: boolean;
  darkMode: boolean;
}

export type ModalType = 'CREATE_SESSION' | 'QR_CODE' | 'SEND_MESSAGE' | null;
export type SystemStatus = 'ONLINE' | 'OFFLINE' | 'CHECKING';

export interface MessagePayload {
  to: string;
  text?: string;
  mediaUrl?: string;
  type?: 'image' | 'video' | 'audio';
  caption?: string;
  buttons?: Array<{id: string, text: string}>;
  footer?: string;
  ptt?: boolean;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'message';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

// --- Automation & Flow Types (N8N Style) ---

export type NodeType = 'webhook' | 'text' | 'media' | 'buttons' | 'condition' | 'wait';

export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';

export interface FlowNode {
  id: string;
  type: NodeType;
  name: string;
  position: { x: number; y: number };
  disabled?: boolean;
  
  parameters: {
    // Webhook / Trigger
    httpMethod?: string;
    path?: string;
    options?: any;
    
    // Actions
    to?: string;
    text?: string;
    mediaUrl?: string;
    caption?: string;
    seconds?: number;
    
    // Condition
    condition?: {
        value1: string;
        operator: ConditionOperator;
        value2: string;
    };

    // Buttons
    buttons?: Array<{id: string, text: string}>;
    footer?: string;
  };

  // N8N Pin Data (Dados de teste)
  pinData?: any; 
  webhookId?: string;
}

export interface AutomationFlow {
  id: string;
  sessionId: string;
  name: string;
  nodes: FlowNode[];
  active: boolean;
  createdAt?: string;
  lastRun?: string;
}

export interface ExecutionContext {
  $json: any;
  from: string;
  env?: any;
}
