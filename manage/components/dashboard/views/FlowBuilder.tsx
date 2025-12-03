
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Play, Plus, MessageSquare, Image, MousePointerClick, GitBranch, Clock, Globe, Copy, Code, Smartphone, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { AutomationFlow, FlowNode, NodeType, SessionUI } from '../../../types';
import { useToast } from '../../../contexts/ToastContext';
import { flowEngine } from '../../../services/flowEngine';

interface FlowBuilderProps {
  initialFlow: AutomationFlow;
  sessions: SessionUI[];
  host: string;
  apiKey: string;
  onSave: (flow: AutomationFlow) => void;
  onCancel: () => void;
}

const DEFAULT_PIN_DATA = {
  "body": {
    "type": "message",
    "sessionId": "DEMO_SESSION",
    "data": {
      "event": "MESSAGE_RECEIVED",
      "id": "MSG_ID_12345",
      "from": "5511999999999@s.whatsapp.net",
      "timestamp": Math.floor(Date.now() / 1000),
      "type": "conversation",
      "content": {
        "type": "text",
        "text": "Oi"
      },
      "sender": {
        "id": "5511999999999@s.whatsapp.net",
        "name": "Cliente Teste",
        "isFromMe": false
      }
    }
  }
};

export const FlowBuilder: React.FC<FlowBuilderProps> = ({ initialFlow, sessions, host, apiKey, onSave, onCancel }) => {
  const [flow, setFlow] = useState<AutomationFlow>(initialFlow);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningNodeId, setRunningNodeId] = useState<string | null>(null);
  const [jsonEditorValue, setJsonEditorValue] = useState('');

  const { addToast } = useToast();
  
  // URL REAL DO SERVIDOR NODE
  const serverUrl = window.location.protocol + '//' + window.location.hostname + ':3000';
  
  // Computa a URL baseada no Path configurado no nó Webhook
  const webhookNode = flow.nodes.find(n => n.type === 'webhook');
  const webhookPath = webhookNode?.parameters?.path || flow.id;
  const webhookUrl = `${serverUrl}/webhook/${webhookPath}`;

  useEffect(() => {
    setFlow(initialFlow);
  }, [initialFlow]);

  useEffect(() => {
    if (selectedNode?.type === 'webhook') {
        const currentPin = selectedNode.pinData || DEFAULT_PIN_DATA;
        setJsonEditorValue(JSON.stringify(currentPin, null, 2));
    }
  }, [selectedNode]);

  const handleAddNode = (type: NodeType) => {
    const newNode: FlowNode = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        name: type === 'text' ? 'Enviar Texto' : type === 'condition' ? 'Condição (If)' : 'Ação',
        position: { x: 0, y: 0 },
        parameters: {
            condition: type === 'condition' ? { value1: '{{ $json.body.data.content.text }}', operator: 'contains', value2: 'Oi' } : undefined
        }
    };
    setFlow(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setSelectedNode(newNode);
  };

  const updateNodeParams = (key: string, value: any) => {
    if (!selectedNode) return;
    const updatedNode = { ...selectedNode, parameters: { ...selectedNode.parameters, [key]: value } };
    setSelectedNode(updatedNode);
    setFlow(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === selectedNode.id ? updatedNode : n) }));
  };

  const updateConditionParams = (key: string, value: any) => {
    if (!selectedNode || !selectedNode.parameters.condition) return;
    const updatedCondition = { ...selectedNode.parameters.condition, [key]: value };
    updateNodeParams('condition', updatedCondition);
  };

  const handleJsonBlur = () => {
      if (!selectedNode) return;
      try {
          const parsed = JSON.parse(jsonEditorValue);
          const updatedNode = { ...selectedNode, pinData: parsed };
          setSelectedNode(updatedNode);
          setFlow(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === selectedNode.id ? updatedNode : n) }));
      } catch (e) {
          addToast({ type: 'error', title: 'JSON Inválido', description: 'Verifique a sintaxe.' });
      }
  };

  const handleRunTest = async () => {
    if (!flow.sessionId) {
        addToast({ type: 'warning', title: 'Selecione uma Sessão', description: 'Necessário para testar o fluxo.' });
        return;
    }

    const startNode = flow.nodes.find(n => n.type === 'webhook');
    const testData = startNode?.pinData || DEFAULT_PIN_DATA;

    setIsRunning(true);
    addToast({ type: 'info', title: 'Executando Teste', description: 'Usando dados simulados...' });

    try {
        await flowEngine.executeFlow(
            flow,
            host,
            apiKey,
            testData,
            (nodeId) => setRunningNodeId(nodeId)
        );
        addToast({ type: 'success', title: 'Sucesso', description: 'Fluxo executado na API.' });
    } catch (error: any) {
        addToast({ type: 'error', title: 'Erro na Execução', description: error.message });
    } finally {
        setIsRunning(false);
        setRunningNodeId(null);
    }
  };

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
        case 'webhook': return <Globe className="w-5 h-5 text-green-400" />;
        case 'text': return <MessageSquare className="w-5 h-5 text-blue-400" />;
        case 'media': return <Image className="w-5 h-5 text-purple-400" />;
        case 'condition': return <GitBranch className="w-5 h-5 text-orange-400" />;
        case 'wait': return <Clock className="w-5 h-5 text-gray-400" />;
        default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0b141a]">
        
        {/* Header */}
        <div className="h-20 border-b border-[#2A3942] bg-[#202C33] flex items-center justify-between px-6 shrink-0 gap-6">
            <div className="flex items-center gap-4 flex-1">
                <button onClick={onCancel} className="text-gray-400 hover:text-white p-2 rounded-full"><ArrowLeft /></button>
                <div className="flex flex-col gap-1">
                    <input 
                        value={flow.name} onChange={(e) => setFlow(p => ({...p, name: e.target.value}))}
                        className="bg-transparent border-none text-[#E9EDEF] font-bold text-lg p-0 focus:ring-0" 
                        placeholder="Nome do Fluxo"
                    />
                    <div className="flex items-center gap-2">
                         <Smartphone className="w-3.5 h-3.5 text-gray-500" />
                         <select 
                            value={flow.sessionId || ''} onChange={(e) => setFlow(p => ({...p, sessionId: e.target.value}))}
                            className="bg-[#111B21] border border-[#2A3942] text-xs text-[#E9EDEF] rounded px-2 py-1"
                         >
                            <option value="" disabled>-- Sessão --</option>
                            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                    </div>
                </div>
            </div>
            <div className="flex gap-3">
                <Button variant="ghost" onClick={handleRunTest} disabled={isRunning} className="text-[#00A884] border border-[#00A884]/30">
                    <Play className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} /> Testar (Frontend)
                </Button>
                <Button onClick={() => onSave(flow)}><Save className="w-4 h-4 mr-2" /> Salvar & Ativar</Button>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Canvas */}
            <div className="flex-1 overflow-y-auto p-10 bg-dots relative">
                <div className="max-w-xl mx-auto flex flex-col items-center pb-20">
                    
                    {/* START NODE */}
                    <div 
                        onClick={() => setSelectedNode(flow.nodes.find(n => n.type === 'webhook') || null)}
                        className={`w-96 bg-[#202C33] border-2 rounded-xl p-5 shadow-lg mb-8 relative cursor-pointer z-10
                            ${selectedNode?.type === 'webhook' ? 'border-[#00A884] ring-2 ring-[#00A884]/20' : 'border-[#00A884]/50'}
                            ${runningNodeId === flow.nodes.find(n => n.type === 'webhook')?.id ? 'ring-4 ring-yellow-400/30' : ''}
                        `}
                    >
                        <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-2 text-[#00A884] font-bold text-xs uppercase"><Globe className="w-4 h-4" /> Webhook (Start)</div>
                             <div className="bg-[#00A884] text-[#111B21] text-[10px] font-bold px-2 rounded">
                                {webhookNode?.parameters?.httpMethod || 'POST'}
                             </div>
                        </div>
                        
                        <div className="bg-[#111B21] p-3 rounded border border-[#2A3942] flex flex-col gap-2 group mb-2">
                            <label className="text-[10px] text-gray-500 uppercase font-bold">URL do Webhook</label>
                            <div className="flex items-center gap-2">
                                <code className="text-xs text-green-400 truncate flex-1 font-mono select-all">{webhookUrl}</code>
                                <Copy className="w-4 h-4 text-gray-500 hover:text-white cursor-pointer" onClick={() => {
                                    navigator.clipboard.writeText(webhookUrl);
                                    addToast({ type: 'success', title: 'Copiado', description: 'URL copiada para área de transferência' });
                                }} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-yellow-500 bg-yellow-500/10 p-2 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Certifique-se que o "server.js" está rodando.</span>
                        </div>

                        <div className="h-8 w-0.5 bg-[#2A3942] absolute -bottom-10 left-1/2 -translate-x-1/2"></div>
                    </div>

                    {/* OTHER NODES */}
                    {flow.nodes.filter(n => n.type !== 'webhook').map(node => (
                        <div key={node.id} className="w-full flex justify-center relative">
                            <div 
                                onClick={() => setSelectedNode(node)}
                                className={`w-80 bg-[#202C33] border rounded-xl p-4 shadow-lg mb-8 relative z-10 cursor-pointer transition-transform hover:scale-105
                                    ${selectedNode?.id === node.id ? 'border-[#00A884] ring-2 ring-[#00A884]/20' : 'border-[#2A3942]'}
                                    ${runningNodeId === node.id ? 'border-yellow-400 ring-4 ring-yellow-400/20' : ''}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#111B21] rounded">{getNodeIcon(node.type)}</div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="font-medium text-[#E9EDEF]">{node.name}</div>
                                        {node.type === 'condition' && (
                                            <div className="text-[10px] text-gray-500 truncate">
                                                {node.parameters.condition?.operator} {node.parameters.condition?.value2}
                                            </div>
                                        )}
                                        {node.type === 'wait' && <div className="text-[10px] text-gray-500">{node.parameters.seconds}s</div>}
                                    </div>
                                </div>
                                <div className="h-8 w-0.5 bg-[#2A3942] absolute -bottom-10 left-1/2 -translate-x-1/2"></div>
                            </div>
                        </div>
                    ))}

                    {/* ADD BUTTON */}
                    <div className="group relative z-20">
                        <button className="w-10 h-10 bg-[#00A884] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#008f6f] transition-all">
                            <Plus />
                        </button>
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 bg-[#202C33] border border-[#2A3942] rounded-xl shadow-2xl hidden group-hover:block p-2">
                             <button onClick={() => handleAddNode('text')} className="w-full text-left px-3 py-2 text-sm text-[#E9EDEF] hover:bg-[#111B21] rounded flex gap-2"><MessageSquare className="w-4 h-4 text-blue-400"/> Texto</button>
                             <button onClick={() => handleAddNode('media')} className="w-full text-left px-3 py-2 text-sm text-[#E9EDEF] hover:bg-[#111B21] rounded flex gap-2"><Image className="w-4 h-4 text-purple-400"/> Mídia</button>
                             <button onClick={() => handleAddNode('condition')} className="w-full text-left px-3 py-2 text-sm text-[#E9EDEF] hover:bg-[#111B21] rounded flex gap-2"><GitBranch className="w-4 h-4 text-orange-400"/> Condição (If)</button>
                             <button onClick={() => handleAddNode('wait')} className="w-full text-left px-3 py-2 text-sm text-[#E9EDEF] hover:bg-[#111B21] rounded flex gap-2"><Clock className="w-4 h-4 text-gray-400"/> Delay</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONFIG PANEL */}
            {selectedNode && (
                <div className="w-96 bg-[#202C33] border-l border-[#2A3942] p-6 overflow-y-auto shadow-2xl z-30">
                    <h3 className="font-bold text-[#E9EDEF] mb-6 flex items-center gap-2">
                        {getNodeIcon(selectedNode.type)} Editar: {selectedNode.name}
                    </h3>
                    
                    {selectedNode.type === 'webhook' ? (
                        <div className="space-y-5">
                            <div className="bg-[#111B21] p-3 rounded text-xs text-gray-400 border border-[#2A3942]">
                                <b>Configurações do Webhook</b><br/>
                                Defina como sua API deve chamar este fluxo.
                            </div>
                            
                            {/* HTTP METHOD */}
                            <div>
                                <label className="text-xs text-gray-500 font-bold mb-1 block">Método HTTP</label>
                                <select 
                                    className="w-full bg-[#111B21] text-[#E9EDEF] border border-[#2A3942] rounded p-2 text-sm"
                                    value={selectedNode.parameters.httpMethod || 'POST'}
                                    onChange={(e) => updateNodeParams('httpMethod', e.target.value)}
                                >
                                    <option value="POST">POST</option>
                                    <option value="GET">GET</option>
                                    <option value="PUT">PUT</option>
                                    <option value="DELETE">DELETE</option>
                                </select>
                            </div>

                            {/* PATH */}
                            <Input 
                                label="Caminho (Path)" 
                                placeholder="meu-webhook-unico"
                                value={selectedNode.parameters.path || ''}
                                onChange={(e) => updateNodeParams('path', e.target.value)}
                            />

                            {/* URL DISPLAY */}
                            <div>
                                <label className="text-xs text-gray-500 font-bold mb-1 block">URL Final (Produção)</label>
                                <div className="bg-[#111B21] p-2 rounded border border-[#2A3942] text-xs font-mono text-green-400 break-all select-all">
                                    {webhookUrl}
                                </div>
                            </div>
                            
                            <hr className="border-[#2A3942]" />

                            {/* PIN DATA */}
                            <div className="relative">
                                <label className="text-xs text-gray-500 font-bold mb-1 block">Dados de Teste (JSON PinData)</label>
                                <textarea 
                                    className="w-full h-60 bg-[#0b141a] text-green-400 font-mono text-xs p-3 rounded border border-[#2A3942] focus:border-[#00A884] focus:outline-none resize-none"
                                    value={jsonEditorValue}
                                    onChange={(e) => setJsonEditorValue(e.target.value)}
                                    onBlur={handleJsonBlur}
                                />
                                <Code className="absolute top-8 right-3 w-4 h-4 text-gray-600" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Input label="Nome do Nó" value={selectedNode.name} onChange={(e) => {
                                const newName = e.target.value;
                                setSelectedNode(p => p ? ({...p, name: newName}) : null);
                                setFlow(prev => ({...prev, nodes: prev.nodes.map(n => n.id === selectedNode.id ? {...n, name: newName} : n)}));
                            }} />
                            
                            <hr className="border-[#2A3942]" />

                            {selectedNode.type === 'text' && (
                                <>
                                    <label className="text-sm text-gray-400 ml-1">Mensagem</label>
                                    <textarea 
                                        className="w-full bg-[#111B21] border border-[#2A3942] rounded p-2 text-[#E9EDEF] text-sm h-32 mb-2 focus:border-[#00A884] outline-none"
                                        value={selectedNode.parameters.text || ''}
                                        onChange={(e) => updateNodeParams('text', e.target.value)}
                                        placeholder="Olá {{ $json.body.data.name }}!"
                                    />
                                    <p className="text-xs text-gray-500 mb-2">Use variáveis: <code>{`{{ $json.body... }}`}</code></p>
                                    <Input label="Destino (Opcional)" placeholder="{{ $json.body.data.from }}" value={selectedNode.parameters.to || ''} onChange={(e) => updateNodeParams('to', e.target.value)} />
                                </>
                            )}

                            {selectedNode.type === 'condition' && selectedNode.parameters.condition && (
                                <div className="space-y-3 bg-[#111B21] p-4 rounded border border-[#2A3942]">
                                    <p className="text-xs text-[#00A884] font-bold uppercase">Lógica Se / Então</p>
                                    <Input 
                                        label="Valor A (Variável)" 
                                        placeholder="{{ $json.body.text }}"
                                        value={selectedNode.parameters.condition.value1}
                                        onChange={(e) => updateConditionParams('value1', e.target.value)}
                                    />
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Operador</label>
                                        <select 
                                            className="w-full bg-[#202C33] text-[#E9EDEF] border border-[#2A3942] rounded p-2 text-sm"
                                            value={selectedNode.parameters.condition.operator}
                                            onChange={(e) => updateConditionParams('operator', e.target.value)}
                                        >
                                            <option value="equals">Igual a (Equals)</option>
                                            <option value="contains">Contém (Contains)</option>
                                            <option value="not_equals">Diferente de</option>
                                            <option value="greater_than">Maior que</option>
                                        </select>
                                    </div>
                                    <Input 
                                        label="Valor B (Comparação)" 
                                        placeholder="Oi"
                                        value={selectedNode.parameters.condition.value2}
                                        onChange={(e) => updateConditionParams('value2', e.target.value)}
                                    />
                                </div>
                            )}

                            {selectedNode.type === 'wait' && (
                                <Input type="number" label="Segundos de Espera" value={selectedNode.parameters.seconds || 1} onChange={(e) => updateNodeParams('seconds', e.target.value)} />
                            )}

                            <Button variant="danger" className="mt-6" onClick={() => {
                                setFlow(prev => ({...prev, nodes: prev.nodes.filter(n => n.id !== selectedNode.id)}));
                                setSelectedNode(null);
                            }}>Remover Nó</Button>
                        </div>
                    )}
                </div>
            )}
        </div>
        <style>{`.bg-dots { background-image: radial-gradient(#2A3942 1px, transparent 1px); background-size: 20px 20px; }`}</style>
    </div>
  );
};
