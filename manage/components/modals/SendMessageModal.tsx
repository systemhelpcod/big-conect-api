import React, { useState, useEffect } from 'react';
import { X, Send, Image as ImageIcon, MessageSquare, ToggleLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MessagePayload, SessionUI } from '../../types';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionUI | null;
  onSend: (sessionId: string, payload: MessagePayload) => Promise<void>;
}

export const SendMessageModal: React.FC<SendMessageModalProps> = ({ isOpen, onClose, session, onSend }) => {
  const [phone, setPhone] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'media' | 'buttons'>('text');
  const [content, setContent] = useState(''); // Text or Caption
  const [mediaUrl, setMediaUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
        setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setFeedback(null);
    setIsLoading(true);

    try {
        const payload: MessagePayload = { to: phone };

        if (messageType === 'text') {
            payload.text = content;
        } else if (messageType === 'media') {
            payload.mediaUrl = mediaUrl;
            payload.caption = content;
            payload.type = 'image'; // defaulting to image for simplicity
        } else if (messageType === 'buttons') {
            payload.text = content || "Teste de botões";
            payload.buttons = [
                { id: "btn1", text: "Sim" },
                { id: "btn2", text: "Não" }
            ];
            payload.footer = "Enviado pelo Manager";
        }

        await onSend(session.id, payload);
        
        // Success feedback
        setFeedback({ type: 'success', message: 'Mensagem enviada com sucesso!' });
        setContent(''); 
        
        // Clear success message after 3 seconds
        setTimeout(() => {
            setFeedback(null);
        }, 3000);

    } catch (error: any) {
        // Error feedback
        setFeedback({ type: 'error', message: error.message || 'Falha ao enviar mensagem.' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#202C33] border border-[#2A3942] rounded-xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#2A3942] flex justify-between items-center bg-[#111B21]">
            <div>
                <h3 className="text-xl font-bold text-[#E9EDEF] flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#00A884]" />
                    Laboratório de Envio
                </h3>
                <p className="text-xs text-gray-500 mt-1">Sessão: <span className="text-[#00A884] font-mono">{session.name}</span></p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
            {/* Sidebar Tabs */}
            <div className="w-48 bg-[#111B21] border-r border-[#2A3942] p-2 space-y-1">
                <button 
                    onClick={() => { setMessageType('text'); setFeedback(null); }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${messageType === 'text' ? 'bg-[#202C33] text-[#00A884]' : 'text-gray-400 hover:bg-[#202C33]/50'}`}
                >
                    <MessageSquare className="w-4 h-4" /> Texto Simples
                </button>
                <button 
                    onClick={() => { setMessageType('media'); setFeedback(null); }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${messageType === 'media' ? 'bg-[#202C33] text-[#00A884]' : 'text-gray-400 hover:bg-[#202C33]/50'}`}
                >
                    <ImageIcon className="w-4 h-4" /> Mídia (URL)
                </button>
                <button 
                    onClick={() => { setMessageType('buttons'); setFeedback(null); }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${messageType === 'buttons' ? 'bg-[#202C33] text-[#00A884]' : 'text-gray-400 hover:bg-[#202C33]/50'}`}
                >
                    <ToggleLeft className="w-4 h-4" /> Botões
                </button>
            </div>

            {/* Form Area */}
            <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto bg-[#202C33] relative">
                
                {/* Visual Feedback Banner */}
                {feedback && (
                    <div className={`mb-6 p-3 rounded-lg flex items-center gap-3 animate-fade-in text-sm font-medium ${
                        feedback.type === 'success' 
                        ? 'bg-[#00A884]/10 text-[#00A884] border border-[#00A884]/20' 
                        : 'bg-[#F15C6D]/10 text-[#F15C6D] border border-[#F15C6D]/20'
                    }`}>
                        {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {feedback.message}
                    </div>
                )}

                <div className="grid gap-6">
                    <Input 
                        label="Número Destinatário"
                        placeholder="5511999999999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />

                    {messageType === 'text' && (
                        <div>
                             <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Mensagem</label>
                             <textarea 
                                className="w-full bg-[#111B21] text-[#E9EDEF] border border-[#2A3942] rounded-lg p-3 h-32 focus:outline-none focus:border-[#00A884] transition-colors resize-none"
                                placeholder="Digite sua mensagem (suporta *negrito*, _itálico_)..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                             />
                        </div>
                    )}

                    {messageType === 'media' && (
                        <>
                            <Input 
                                label="URL da Mídia (Imagem/Vídeo)"
                                placeholder="https://exemplo.com/foto.jpg"
                                value={mediaUrl}
                                onChange={(e) => setMediaUrl(e.target.value)}
                                required
                            />
                             <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Legenda (Opcional)</label>
                                <textarea 
                                    className="w-full bg-[#111B21] text-[#E9EDEF] border border-[#2A3942] rounded-lg p-3 h-20 focus:outline-none focus:border-[#00A884] transition-colors resize-none"
                                    placeholder="Legenda da mídia..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {messageType === 'buttons' && (
                         <div className="bg-[#111B21] p-4 rounded-lg border border-[#2A3942]">
                             <p className="text-yellow-500 text-sm mb-3">⚠️ Modo Demonstração</p>
                             <p className="text-gray-400 text-sm">
                                 Enviará botões fixos "Sim" e "Não" com o texto abaixo:
                             </p>
                             <Input 
                                label="Texto do Corpo"
                                placeholder="Você aceita os termos?"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="mt-3"
                            />
                         </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end">
                    <Button type="submit" isLoading={isLoading} className="w-auto px-8">
                        <Send className="w-4 h-4" />
                        Enviar Mensagem
                    </Button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};