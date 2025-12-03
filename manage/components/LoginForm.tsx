import React, { useState, useEffect } from 'react';
import { Server, Key, Eye, EyeOff, LogIn, AlertCircle, Check } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { SessionRaw, SessionUI } from '../types';
import { formatLastActivity } from '../utils/formatters';
import { api } from '../services/api';

interface LoginFormProps {
  onSuccess: (sessions: SessionUI[], host: string, apiKey: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [host, setHost] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedHost = localStorage.getItem('big_conect_host');
    const savedKey = localStorage.getItem('big_conect_apikey');
    
    if (savedHost) setHost(savedHost);
    if (savedKey) setApiKey(savedKey);
    if (savedHost && savedKey) setRememberMe(true);
  }, []);

  const normalizeUrl = (url: string): string => {
    let normalized = url.trim();
    normalized = normalized.replace(/\/+$/, '');
    
    if (normalized.startsWith('http://') && !normalized.includes('localhost') && !normalized.includes('127.0.0.1')) {
       normalized = normalized.replace('http://', 'https://');
    }
    
    if (!/^https?:\/\//i.test(normalized)) {
      if (normalized.includes('localhost') || normalized.includes('127.0.0.1')) {
          normalized = `http://${normalized}`;
      } else {
          normalized = `https://${normalized}`;
      }
    }
    return normalized;
  };

  const mapSessions = (rawSessions: SessionRaw[]): SessionUI[] => {
    return rawSessions.map((s, index) => {
      let status: SessionUI['status'] = 'Desconectado';
      const rawStatus = s.status?.toLowerCase() || '';
      
      if (s.isConnected || rawStatus === 'connected' || rawStatus === 'inchat' || rawStatus === 'working') {
        status = 'Conectado';
      } 
      else if (rawStatus.includes('qr') || rawStatus.includes('scan') || rawStatus === 'connecting') {
        status = 'QR Scan';
      }

      const displayName = s.user?.name || `Cliente ${index + 1}`;

      return {
        id: s.sessionId,
        name: displayName,
        status,
        statusRaw: s.status,
        lastActivity: formatLastActivity(s.lastActivity),
        battery: s.battery
      };
    });
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const normalizedHost = normalizeUrl(host);

    try {
      if (!host) throw new Error('Por favor, informe a URL da API.');
      if (!apiKey) throw new Error('Por favor, informe a API Key.');

      try {
        // Usa o serviço centralizado de API
        const rawSessions = await api.validateConnection(normalizedHost, apiKey);
        
        // Formata os dados para a UI
        const uiSessions = mapSessions(rawSessions);

        if (rememberMe) {
            localStorage.setItem('big_conect_host', host);
            localStorage.setItem('big_conect_apikey', apiKey);
        } else {
            localStorage.removeItem('big_conect_host');
            localStorage.removeItem('big_conect_apikey');
        }

        onSuccess(uiSessions, normalizedHost, apiKey);

      } catch (err: any) {
        console.error("Erro no login:", err);
        
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            let msg = `O navegador bloqueou a conexão com ${normalizedHost}.`;
            if (normalizedHost.startsWith('https') && !isLocalhost) {
               msg += `\n\nPossível Causa: CORS (Política de Segurança do Navegador).`;
               msg += `\nDiagnóstico: Servidor pode estar retornando 'Access-Control-Allow-Origin: *' junto com 'Access-Control-Allow-Credentials: true'.`;
            } else {
               msg += `\n\nVerifique se o servidor está online e aceita conexões HTTPS.`;
            }
            throw new Error(msg);
        }

        if (err.message.includes('429')) {
             throw new Error("Muitas tentativas de conexão. Aguarde alguns instantes.");
        }

        throw new Error(err.message || 'Falha ao validar credenciais.');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] p-8 sm:p-10 bg-[#202C33] rounded-2xl shadow-2xl border border-[#2A3942] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A884] to-[#00CC99]"></div>

      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#111B21] border border-[#2A3942] mb-5 shadow-lg relative group">
            <div className="absolute inset-0 bg-[#00A884]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Server className="w-9 h-9 text-[#00A884] relative z-10" />
        </div>
        <h1 className="text-2xl font-bold text-[#E9EDEF] tracking-tight">Big Conect Manager</h1>
        <p className="text-gray-400 text-sm mt-2 font-light">Gerenciamento profissional de sessões</p>
      </div>

      <form onSubmit={handleConnect} className="space-y-5">
        <Input
          label="URL do Servidor"
          placeholder="ex: big-api.suaempresa.com"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          icon={<Server className="w-5 h-5" />}
          type="text"
          autoComplete="url"
        />

        <div className="space-y-1">
            <Input
            label="Chave de Acesso (API Key)"
            placeholder="Insira sua chave segura"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            type={showKey ? "text" : "password"}
            icon={<Key className="w-5 h-5" />}
            className="mb-0" 
            rightElement={
                <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-gray-500 hover:text-[#00A884] focus:outline-none transition-colors p-1"
                title={showKey ? "Ocultar" : "Mostrar"}
                >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            }
            />
        </div>

        <div className="flex items-center justify-between pt-1">
            <label 
                className="flex items-center gap-2.5 cursor-pointer group select-none"
                onClick={() => setRememberMe(!rememberMe)}
            >
                <div className={`
                    w-5 h-5 rounded border flex items-center justify-center transition-all duration-200
                    ${rememberMe 
                        ? 'bg-[#00A884] border-[#00A884] text-[#111B21]' 
                        : 'bg-transparent border-gray-600 group-hover:border-[#00A884]'}
                `}>
                    {rememberMe && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className={`text-sm transition-colors ${rememberMe ? 'text-[#E9EDEF]' : 'text-gray-400 group-hover:text-gray-300'}`}>
                    Lembrar meus dados
                </span>
            </label>
        </div>

        {error && (
          <div className="p-4 bg-[#F15C6D]/10 border border-[#F15C6D]/20 rounded-lg flex items-start gap-3 text-[#F15C6D] text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
                <span className="font-semibold">Erro de Conexão</span>
                <p className="whitespace-pre-line leading-relaxed opacity-90">{error}</p>
            </div>
          </div>
        )}

        <div className="pt-2">
            <Button 
            type="submit" 
            isLoading={isLoading} 
            className="w-full h-12 text-base shadow-lg shadow-[#00A884]/10 hover:shadow-[#00A884]/20 hover:-translate-y-0.5"
            icon={<LogIn className="w-5 h-5" />}
            >
            {isLoading ? 'Autenticando...' : 'Acessar Painel'}
            </Button>
        </div>
      </form>
    </div>
  );
};