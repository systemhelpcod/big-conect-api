import { useState, useCallback, useEffect, useRef } from 'react';
import { SessionRaw, SessionUI, SystemStatus, MessagePayload } from '../types';
import { formatLastActivity } from '../utils/formatters';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface UseBigConectApiReturn {
  sessions: SessionUI[];
  systemStatus: SystemStatus;
  apiVersion: string;
  isRefreshing: boolean;
  
  // Actions
  checkSystemStatus: () => Promise<void>;
  refreshSessions: (silent?: boolean) => Promise<void>;
  createSession: (name: string) => Promise<void>;
  deleteSession: (session: SessionUI) => Promise<void>;
  sendMessage: (sessionId: string, payload: MessagePayload) => Promise<void>;
  fetchQR: (sessionId: string) => Promise<string | null>;
}

export const useBigConectApi = (
  host: string, 
  apiKey: string, 
  isActive: boolean
): UseBigConectApiReturn => {
  const [sessions, setSessions] = useState<SessionUI[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('ONLINE');
  const [apiVersion, setApiVersion] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { addToast } = useToast();
  
  // Refs to prevent duplicate simulation in React 18 strict mode
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Helpers ---

  const mapSessions = (rawSessions: SessionRaw[]): SessionUI[] => {
    return rawSessions.map((s, index) => {
        const rawStatus = s.status?.toLowerCase() || '';
        let uiStatus: SessionUI['status'] = 'Desconectado';

        if (s.isConnected || rawStatus === 'connected' || rawStatus === 'inchat' || rawStatus === 'working') {
            uiStatus = 'Conectado';
        } else if (rawStatus.includes('qr') || rawStatus.includes('scan') || rawStatus === 'connecting') {
            uiStatus = 'QR Scan';
        }

        return {
            id: s.sessionId,
            name: s.user?.name || `Cliente ${index + 1}`,
            status: uiStatus,
            statusRaw: s.status,
            lastActivity: formatLastActivity(s.lastActivity),
            battery: s.battery,
            isDeleting: false
        };
    });
  };

  // --- Actions ---

  const checkSystemStatus = useCallback(async () => {
    if (!host) return;

    const health = await api.checkSystemHealth(host);
    setSystemStatus(health.status);
    if (health.version) setApiVersion(health.version);

    // If health check fails, we already know we are offline
  }, [host]);

  const refreshSessions = useCallback(async (silent = false) => {
    if (!host || !apiKey) return;
    if (!silent) setIsRefreshing(true);
    
    try {
        const rawSessions = await api.getSessions(host, apiKey);
        const updatedSessions = mapSessions(rawSessions);

        setSessions(prev => {
            return updatedSessions.map(newS => {
                const oldS = prev.find(p => p.id === newS.id);
                if (oldS?.isDeleting) return { ...newS, isDeleting: true };
                return newS;
            });
        });
        
        // If we succeeded, system is online
        if (systemStatus === 'OFFLINE') setSystemStatus('ONLINE');
        
    } catch (error: any) {
        const msg = error.message || '';
        // Handle network errors gracefully without throwing to console if possible
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Aborted')) {
            setSystemStatus('OFFLINE');
            if (!silent) {
                 console.warn("Hook: Conexão com API perdida.");
                 addToast({ 
                    type: 'error', 
                    title: 'Conexão Perdida', 
                    description: 'Não foi possível contatar o servidor.' 
                });
            }
        } else {
            if (!silent) {
                console.error("Hook: Falha ao atualizar sessões", error);
                addToast({ 
                    type: 'error', 
                    title: 'Erro na API', 
                    description: msg 
                });
            }
        }
    } finally {
        if (!silent) setIsRefreshing(false);
    }
  }, [host, apiKey, addToast, systemStatus]);

  const createSession = async (name: string) => {
    if (systemStatus === 'OFFLINE') throw new Error("API Offline");
    
    try {
        await api.createSession(host, apiKey, name);
        addToast({ type: 'success', title: 'Sessão Criada', description: `A sessão "${name}" foi iniciada.` });
        await refreshSessions();
    } catch (e: any) {
        addToast({ type: 'error', title: 'Erro ao criar', description: e.message });
        throw e;
    }
  };

  const deleteSession = async (session: SessionUI) => {
    if (systemStatus === 'OFFLINE') throw new Error("API Offline");

    setSessions(prev => prev.map(s => s.id === session.id ? { ...s, isDeleting: true } : s));

    try {
        await api.deleteSession(host, apiKey, session.id);
        setSessions(prev => prev.filter(s => s.id !== session.id));
        addToast({ type: 'success', title: 'Sessão Removida', description: `A sessão ${session.name} foi desconectada.` });
    } catch (e: any) {
        setSessions(prev => prev.map(s => s.id === session.id ? { ...s, isDeleting: false } : s));
        addToast({ type: 'error', title: 'Erro ao deletar', description: e.message });
        throw e;
    }
  };

  const sendMessage = async (sessionId: string, payload: MessagePayload) => {
    if (systemStatus === 'OFFLINE') throw new Error("Sistema Offline");
    try {
        await api.sendMessage(host, apiKey, sessionId, payload);
    } catch (e: any) {
        throw e;
    }
  };

  const fetchQR = async (sessionId: string): Promise<string | null> => {
    try {
        return await api.getQRCode(host, apiKey, sessionId);
    } catch (e) {
        return null;
    }
  };

  // --- MOCK INCOMING MESSAGE SIMULATION ---
  useEffect(() => {
    if (isActive && sessions.length > 0) {
        const randomTime = Math.floor(Math.random() * (60000 - 20000 + 1) + 20000); 
        
        simulationRef.current = setInterval(() => {
            const connectedSessions = sessions.filter(s => s.status === 'Conectado');
            if (connectedSessions.length > 0) {
                const randomSession = connectedSessions[Math.floor(Math.random() * connectedSessions.length)];
                const randomContact = Math.floor(Math.random() * 90000000) + 10000000;
                
                addToast({
                    type: 'message',
                    title: `Nova mensagem em ${randomSession.name}`,
                    description: `+55 11 9${randomContact}: Olá!`,
                    duration: 5000
                });
            }
        }, randomTime);

        return () => {
            if (simulationRef.current) clearInterval(simulationRef.current);
        };
    }
  }, [isActive, sessions, addToast]);

  // --- Effects ---

  useEffect(() => {
    if (isActive && host) {
        checkSystemStatus();
        refreshSessions();

        const healthInterval = setInterval(() => checkSystemStatus(), 60000);
        
        const sessionInterval = setInterval(() => {
            // Only poll sessions if we think we are online to avoid error spam
            if (systemStatus === 'ONLINE') {
                refreshSessions(true);
            }
        }, 25000);

        return () => {
            clearInterval(healthInterval);
            clearInterval(sessionInterval);
        };
    }
  }, [isActive, host, systemStatus, checkSystemStatus, refreshSessions]);

  return {
    sessions,
    systemStatus,
    apiVersion,
    isRefreshing,
    checkSystemStatus,
    refreshSessions,
    createSession,
    deleteSession,
    sendMessage,
    fetchQR
  };
};