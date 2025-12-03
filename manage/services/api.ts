import { SessionRaw, ApiResponse, MessagePayload, SessionUI } from '../types';

/**
 * Utilitário para cabeçalhos padrão
 */
const getHeaders = (apiKey: string, includeContentType = true): HeadersInit => {
  const headers: HeadersInit = {
    'x-api-key': apiKey.trim()
  };
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

/**
 * Helper com timeout padrão de 8s para evitar que a UI congele esperando
 */
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit'
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

export const api = {
  /**
   * Valida a conexão (Login)
   */
  validateConnection: async (host: string, apiKey: string): Promise<SessionRaw[]> => {
    const endpoint = `${host}/api/sessions`;
    
    console.log(`[API] Validando conexão: ${endpoint}`);

    const res = await fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: { 'x-api-key': apiKey.trim() }
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error('Chave de API inválida ou não autorizada.');
    }

    if (!res.ok) {
      if (res.status === 404) throw new Error('Endpoint /api/sessions não encontrado.');
      throw new Error(`Erro na API (${res.status}): ${res.statusText}`);
    }

    const data = await res.json();

    if (Array.isArray(data)) return data;
    if ((data as any).response && Array.isArray((data as any).response)) return (data as any).response;
    if ((data as any).data && Array.isArray((data as any).data)) return (data as any).data;
    
    return [];
  },

  /**
   * Health Check do Sistema
   */
  checkSystemHealth: async (host: string): Promise<{ status: 'ONLINE' | 'OFFLINE', version?: string }> => {
    try {
      const res = await fetchWithTimeout(`${host}/`, { method: 'GET' }, 5000);
      
      if (res.status === 502 || res.status === 503 || res.status === 504) {
         return { status: 'OFFLINE' };
      }

      if (!res.ok) throw new Error("API Error");

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         throw new Error("Invalid Response Type");
      }

      const data = await res.json();
      return { status: 'ONLINE', version: data.version };

    } catch (error) {
      return { status: 'OFFLINE' };
    }
  },

  /**
   * Busca lista de sessões
   */
  getSessions: async (host: string, apiKey: string): Promise<SessionRaw[]> => {
    const res = await fetchWithTimeout(`${host}/api/sessions`, {
      method: 'GET',
      headers: { 'x-api-key': apiKey.trim() }
    });

    if (!res.ok) throw new Error("Falha ao buscar sessões");

    const data = await res.json();
    
    if (Array.isArray(data)) return data;
    if ((data as any).data && Array.isArray((data as any).data)) return (data as any).data;
    
    return [];
  },

  /**
   * Cria nova sessão
   */
  createSession: async (host: string, apiKey: string, name: string): Promise<void> => {
    const res = await fetchWithTimeout(`${host}/api/sessions`, {
        method: 'POST',
        headers: getHeaders(apiKey, true),
        body: JSON.stringify({ name: name })
    });
    
    if (!res.ok) throw new Error("Falha na criação da sessão");
  },

  /**
   * Deleta sessão (Estilo CURL)
   */
  deleteSession: async (host: string, apiKey: string, sessionId: string): Promise<void> => {
    const deleteUrl = `${host}/api/sessions/${sessionId}`;
    const key = apiKey.trim();

    console.log(`[API] Executando DELETE:\nURL: ${deleteUrl}\nHeader: x-api-key: ${key}`);

    const res = await fetchWithTimeout(deleteUrl, {
        method: 'DELETE',
        headers: { 'x-api-key': key } 
    });
    
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Erro ${res.status}`);
    }
  },

  /**
   * Busca QR Code
   */
  getQRCode: async (host: string, apiKey: string, sessionId: string): Promise<string | null> => {
    const res = await fetchWithTimeout(`${host}/api/sessions/${sessionId}/qr`, {
        method: 'GET',
        headers: { 'x-api-key': apiKey.trim() }
    });
    const data = await res.json();
    return data.qr || data.qrcode || (data.data ? data.data.qr : null) || null;
  },

  /**
   * Envia Mensagem
   */
  sendMessage: async (host: string, apiKey: string, sessionId: string, payload: MessagePayload): Promise<void> => {
    let endpoint = 'text'; 
    if (payload.mediaUrl) endpoint = 'media';
    if (payload.buttons) endpoint = 'buttons';

    const res = await fetchWithTimeout(`${host}/api/${sessionId}/messages/${endpoint}`, {
        method: 'POST',
        headers: getHeaders(apiKey, true),
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || err.message || "Erro ao enviar mensagem");
    }
  }
};