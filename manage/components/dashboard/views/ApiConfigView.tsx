import React, { useState } from 'react';
import { Server, Activity, ShieldCheck, Globe, Clock } from 'lucide-react';
import { Button } from '../../ui/Button';
import { SystemStatus } from '../../../types';

interface ApiConfigViewProps {
  host: string;
  apiKey: string;
  systemStatus: SystemStatus;
  apiVersion: string;
}

export const ApiConfigView: React.FC<ApiConfigViewProps> = ({ host, apiKey, systemStatus, apiVersion }) => {
  const [latency, setLatency] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testLatency = async () => {
    setIsTesting(true);
    const start = Date.now();
    try {
        await fetch(`${host}/health?t=${start}`); // Cache buster
        const end = Date.now();
        setLatency(end - start);
    } catch (e) {
        setLatency(null);
    } finally {
        setIsTesting(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-[#111B21] animate-fade-in">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#E9EDEF] mb-6 flex items-center gap-3">
                <Server className="text-[#00A884]" /> Configurações da Conexão
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Status Card */}
                <div className="bg-[#202C33] border border-[#2A3942] p-6 rounded-xl relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-lg ${systemStatus === 'ONLINE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Status do Sistema</p>
                            <h3 className="text-xl font-bold text-[#E9EDEF]">
                                {systemStatus === 'ONLINE' ? 'Operacional' : 'Indisponível'}
                            </h3>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-[#111B21] rounded-full overflow-hidden">
                        <div className={`h-full ${systemStatus === 'ONLINE' ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: '100%' }}></div>
                    </div>
                </div>

                {/* Latency Card */}
                <div className="bg-[#202C33] border border-[#2A3942] p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Latência da API</p>
                                <h3 className="text-xl font-bold text-[#E9EDEF]">
                                    {latency !== null ? `${latency}ms` : '--'}
                                </h3>
                            </div>
                        </div>
                        <Button variant="secondary" onClick={testLatency} isLoading={isTesting} className="w-auto px-4">
                            Testar
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500">Tempo de resposta entre o painel e o servidor.</p>
                </div>
            </div>

            <div className="bg-[#202C33] border border-[#2A3942] rounded-xl overflow-hidden">
                <div className="p-4 bg-[#111B21] border-b border-[#2A3942] font-semibold text-[#E9EDEF]">
                    Detalhes Técnicos
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 block">Host Endpoint</label>
                        <div className="flex items-center gap-2 text-[#E9EDEF] font-mono bg-[#111B21] p-3 rounded border border-[#2A3942]">
                            <Globe className="w-4 h-4 text-gray-500" />
                            {host}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 block">Chave de Segurança (API Key)</label>
                        <div className="flex items-center gap-2 text-[#E9EDEF] font-mono bg-[#111B21] p-3 rounded border border-[#2A3942]">
                            <ShieldCheck className="w-4 h-4 text-[#00A884]" />
                            {apiKey.substring(0, 4)}••••••••••••••••{apiKey.substring(apiKey.length - 4)}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">A chave nunca é exposta completamente por segurança.</p>
                    </div>

                    <div>
                         <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 block">Versão do Servidor</label>
                         <span className="inline-block px-3 py-1 bg-[#2A3942] text-gray-300 rounded text-sm">
                            v{apiVersion || '1.0.0'}
                         </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};