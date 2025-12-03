
import React, { useState, useEffect } from 'react';
import { Workflow, Plus, Edit2, Trash2, Smartphone } from 'lucide-react';
import { Button } from '../../ui/Button';
import { FlowBuilder } from './FlowBuilder';
import { AutomationFlow, SessionUI } from '../../../types';
import { db } from '../../../services/database';
import { useToast } from '../../../contexts/ToastContext';

interface AutomationsViewProps {
  sessions: SessionUI[];
  host: string;
  apiKey: string;
}

export const AutomationsView: React.FC<AutomationsViewProps> = ({ sessions, host, apiKey }) => {
  const [mode, setMode] = useState<'LIST' | 'EDITOR'>('LIST');
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [currentFlow, setCurrentFlow] = useState<AutomationFlow | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
      const data = await db.getAllAutomations();
      setFlows(data);
  };

  const handleEdit = (flow: AutomationFlow) => {
    setCurrentFlow(flow);
    setMode('EDITOR');
  };

  const handleCreate = () => {
    const webhookId = Math.random().toString(36).substr(2, 9);
    const newFlow: AutomationFlow = {
        id: webhookId,
        name: 'Nova Automação',
        sessionId: '', // Starts empty
        active: false,
        nodes: [
            {
                id: 'start_node',
                type: 'webhook',
                name: 'Gatilho (Webhook)',
                position: { x: 0, y: 0 },
                parameters: {
                    path: webhookId, // Path default é o ID, mas usuário pode mudar
                    httpMethod: 'POST',
                    options: {}
                },
                webhookId: webhookId
            }
        ]
    };
    setCurrentFlow(newFlow);
    setMode('EDITOR');
  };

  const handleSaveFlow = async (updatedFlow: AutomationFlow) => {
    await db.saveAutomation(updatedFlow);
    await loadFlows();
    addToast({ type: 'success', title: 'Salvo com sucesso', description: 'O fluxo foi armazenado no banco de dados.' });
    setMode('LIST');
  };

  const handleDelete = async (id: string) => {
      if (confirm('Tem certeza que deseja excluir esta automação?')) {
          await db.deleteAutomation(id);
          await loadFlows();
          addToast({ type: 'success', title: 'Automação excluída', description: 'Registro removido.' });
      }
  };

  const getSessionName = (id: string) => {
      const sess = sessions.find(s => s.id === id);
      return sess ? sess.name : 'Sessão desconhecida/offline';
  };

  if (mode === 'EDITOR' && currentFlow) {
      return (
        <FlowBuilder 
            initialFlow={currentFlow} 
            sessions={sessions}
            host={host}
            apiKey={apiKey}
            onSave={handleSaveFlow} 
            onCancel={() => setMode('LIST')} 
        />
      );
  }

  return (
    <div className="p-6 h-full overflow-y-auto bg-[#111B21] animate-fade-in">
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-[#E9EDEF] flex items-center gap-3">
                        <Workflow className="text-[#00A884]" /> Automações (Workflow)
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Gerencie fluxos inteligentes integrados às sessões do WhatsApp.</p>
                </div>
                <Button onClick={handleCreate} icon={<Plus className="w-4 h-4" />}>
                    Criar Fluxo
                </Button>
            </div>

            {flows.length === 0 ? (
                <div className="text-center py-20 bg-[#202C33]/50 rounded-xl border-2 border-dashed border-[#2A3942]">
                    <Workflow className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400">Nenhuma automação criada</h3>
                    <p className="text-sm text-gray-500 mb-6">Crie seu primeiro fluxo para automatizar respostas.</p>
                    <Button onClick={handleCreate}>Criar Agora</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flows.map(flow => (
                        <div key={flow.id} className="bg-[#202C33] border border-[#2A3942] rounded-xl p-5 hover:border-[#00A884]/50 transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-[#00A884]/10 rounded-lg text-[#00A884]">
                                    <Workflow className="w-6 h-6" />
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${flow.active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                                    {flow.active ? 'ATIVO' : 'PAUSADO'}
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-[#E9EDEF] mb-1 truncate" title={flow.name}>{flow.name}</h3>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 bg-[#111B21] p-2 rounded border border-[#2A3942]">
                                <Smartphone className="w-3.5 h-3.5 text-[#00A884]" />
                                <span className="truncate">{getSessionName(flow.sessionId)}</span>
                            </div>

                            <div className="flex gap-2 border-t border-[#2A3942] pt-4">
                                <Button variant="secondary" onClick={() => handleEdit(flow)} className="flex-1 text-sm">
                                    <Edit2 className="w-3.5 h-3.5" /> Editar
                                </Button>
                                <Button variant="ghost" onClick={() => handleDelete(flow.id)} className="px-3 text-[#F15C6D] hover:bg-[#F15C6D]/10">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
