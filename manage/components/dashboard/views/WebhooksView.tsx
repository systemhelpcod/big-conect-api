import React, { useState, useEffect } from 'react';
import { Radio, Save, Send, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { useToast } from '../../../contexts/ToastContext';

export const WebhooksView: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [active, setActive] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    // Simulate loading saved webhook
    const saved = localStorage.getItem('big_conect_webhook');
    if (saved) setWebhookUrl(saved);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
        if (!webhookUrl.startsWith('http')) {
            addToast({ type: 'error', title: 'URL Inválida', description: 'O Webhook deve começar com http:// ou https://' });
            setIsSaving(false);
            return;
        }
        localStorage.setItem('big_conect_webhook', webhookUrl);
        addToast({ type: 'success', title: 'Webhook Salvo', description: 'A URL de retorno foi atualizada.' });
        setIsSaving(false);
    }, 800);
  };

  const handleTest = async () => {
    if (!webhookUrl) return;
    setIsTesting(true);

    const mockPayload = {
        event: "MESSAGE_RECEIVED",
        instanceId: "test_instance_123",
        data: {
            id: "MSG_ID_" + Math.random().toString(36).substr(2, 9),
            from: "5511999999999@s.whatsapp.net",
            type: "text",
            body: "Teste de Webhook do Manager",
            pushName: "Usuário Teste",
            timestamp: Math.floor(Date.now() / 1000)
        }
    };

    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockPayload)
        });

        const status = res.status;
        const success = status >= 200 && status < 300;

        setLogs(prev => [{
            id: Date.now(),
            status,
            success,
            time: new Date().toLocaleTimeString(),
            url: webhookUrl
        }, ...prev].slice(0, 10));

        if (success) {
            addToast({ type: 'success', title: 'Teste Enviado', description: `Servidor respondeu com ${status}` });
        } else {
             addToast({ type: 'warning', title: 'Falha no Teste', description: `Servidor respondeu com ${status}` });
        }

    } catch (e: any) {
         setLogs(prev => [{
            id: Date.now(),
            status: 'ERR',
            success: false,
            time: new Date().toLocaleTimeString(),
            url: webhookUrl,
            error: e.message
        }, ...prev].slice(0, 10));
        addToast({ type: 'error', title: 'Erro de Conexão', description: e.message });
    } finally {
        setIsTesting(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-[#111B21] animate-fade-in">
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#E9EDEF] mb-6 flex items-center gap-3">
                <Radio className="text-[#00A884]" /> Gerenciamento de Webhooks
            </h2>

            <div className="grid gap-6">
                
                {/* Configuration Card */}
                <div className="bg-[#202C33] border border-[#2A3942] rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-[#E9EDEF]">Configuração Global</h3>
                            <p className="text-gray-400 text-sm">
                                Defina a URL que receberá notificações em tempo real de todas as sessões.
                            </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {active ? 'ATIVO' : 'INATIVO'}
                        </div>
                    </div>

                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <Input 
                                label="URL do Webhook (POST)"
                                placeholder="https://seu-sistema.com/api/webhook"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                className="mb-0"
                            />
                        </div>
                        <div className="mb-[2px]">
                            <Button onClick={handleSave} isLoading={isSaving} className="w-auto">
                                <Save className="w-4 h-4" /> Salvar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Testing Area */}
                <div className="bg-[#202C33] border border-[#2A3942] rounded-xl p-6">
                    <h3 className="text-lg font-bold text-[#E9EDEF] mb-4 flex items-center gap-2">
                        <Play className="w-4 h-4 text-[#00A884]" /> Teste de Disparo
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                        Envia um evento fictício de <b>MESSAGE_RECEIVED</b> para a URL configurada acima para validar a recepção.
                    </p>
                    <Button variant="secondary" onClick={handleTest} isLoading={isTesting} disabled={!webhookUrl}>
                        <Send className="w-4 h-4" /> Enviar Evento de Teste
                    </Button>
                </div>

                {/* Logs */}
                <div className="bg-[#202C33] border border-[#2A3942] rounded-xl overflow-hidden">
                     <div className="p-4 bg-[#111B21] border-b border-[#2A3942] font-semibold text-[#E9EDEF] flex justify-between items-center">
                        <span>Histórico de Disparos</span>
                        <span className="text-xs font-normal text-gray-500">Últimos 10 testes</span>
                    </div>
                    <div className="divide-y divide-[#2A3942]">
                        {logs.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                Nenhum teste realizado nesta sessão.
                            </div>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-[#2A3942]/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        {log.success ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                        )}
                                        <div>
                                            <div className="text-sm font-medium text-[#E9EDEF] flex items-center gap-2">
                                                POST {log.status}
                                                <span className="text-xs text-gray-500 font-mono">({log.time})</span>
                                            </div>
                                            <div className="text-xs text-gray-400 truncate max-w-md">
                                                {log.url}
                                            </div>
                                            {log.error && <div className="text-xs text-red-400 mt-1">{log.error}</div>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};
