import React, { useState } from 'react';
import { SessionUI, ModalType, SystemStatus, MessagePayload } from '../../../types';
import { Header } from '../Header';
import { Stats } from '../Stats';
import { SessionCard } from '../../SessionCard';
import { EmptyState } from '../EmptyState';
import { CreateSessionModal } from '../../modals/CreateSessionModal';
import { QRCodeModal } from '../../modals/QRCodeModal';
import { SendMessageModal } from '../../modals/SendMessageModal';
import { ServerCrash } from 'lucide-react';

interface SessionsViewProps {
  sessions: SessionUI[];
  systemStatus: SystemStatus;
  host: string;
  apiVersion: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onCreateSession: (name: string) => Promise<void>;
  onDeleteSession: (session: SessionUI) => Promise<void>;
  onSendMessage: (sessionId: string, payload: MessagePayload) => Promise<void>;
  onFetchQR: (sessionId: string) => Promise<string | null>;
  onLogout: () => void;
}

export const SessionsView: React.FC<SessionsViewProps> = ({
  sessions,
  systemStatus,
  host,
  apiVersion,
  isRefreshing,
  onRefresh,
  onCreateSession,
  onDeleteSession,
  onSendMessage,
  onFetchQR,
  onLogout
}) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedSession, setSelectedSession] = useState<SessionUI | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter Logic
  const filteredSessions = sessions.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSubmit = async (name: string) => {
    try {
        await onCreateSession(name);
    } catch (e) {
        // Error handled by hook/toast
    }
  };

  const handleDeleteSession = async (session: SessionUI) => {
    if (confirm(`Tem certeza que deseja excluir a sessão de ${session.name}?`)) {
        try {
            await onDeleteSession(session);
        } catch (e: any) {
            alert(`Erro ao deletar: ${e.message}`);
        }
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-[#111B21]">
        
        <div className="max-w-7xl mx-auto space-y-6">
            
            {/* OFFLINE BANNER */}
            {systemStatus === 'OFFLINE' && (
                <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-4 flex items-center gap-3 text-red-400 animate-pulse">
                    <ServerCrash className="w-6 h-6 shrink-0" />
                    <div>
                        <h3 className="font-bold text-red-400">API Indisponível (502/Offline)</h3>
                        <p className="text-sm opacity-90">
                            Não foi possível conectar ao servidor. Verifique se a API está rodando.
                        </p>
                    </div>
                </div>
            )}

            <Header 
                systemStatus={systemStatus}
                host={host}
                apiVersion={apiVersion}
                isRefreshing={isRefreshing}
                onOpenCreate={() => setActiveModal('CREATE_SESSION')}
                onRefresh={onRefresh}
                onLogout={onLogout}
            />

            <Stats sessions={sessions} />
            
            {/* Search Bar */}
            <div className="bg-[#202C33] px-4 py-3 rounded-xl border border-[#2A3942] flex items-center gap-3">
                <input 
                    type="text"
                    placeholder="Filtrar sessões por nome ou ID..."
                    className="bg-transparent border-none focus:ring-0 text-[#E9EDEF] w-full placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="text-xs text-gray-500 font-mono border border-gray-600 rounded px-1.5 py-0.5">
                    {filteredSessions.length} Resultados
                </div>
            </div>

            {/* Grid */}
            {filteredSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                    {filteredSessions.map((session) => (
                        <SessionCard 
                            key={session.id} 
                            session={session} 
                            onOpenQR={(s) => { setSelectedSession(s); setActiveModal('QR_CODE'); }}
                            onTestMessage={(s) => { setSelectedSession(s); setActiveModal('SEND_MESSAGE'); }}
                            onDelete={handleDeleteSession}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-10">
                    {sessions.length === 0 ? (
                        <EmptyState 
                            systemStatus={systemStatus}
                            onOpenCreate={() => setActiveModal('CREATE_SESSION')}
                        />
                    ) : (
                        <div className="text-center text-gray-500 mt-10">
                            Nenhuma sessão encontrada para "{searchTerm}"
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Modals are managed here now */}
        <CreateSessionModal 
            isOpen={activeModal === 'CREATE_SESSION'}
            onClose={() => setActiveModal(null)}
            onSubmit={handleCreateSubmit}
        />
        
        <QRCodeModal
            isOpen={activeModal === 'QR_CODE'}
            onClose={() => { setActiveModal(null); setSelectedSession(null); }}
            session={selectedSession}
            onRefresh={onFetchQR}
        />

        <SendMessageModal 
            isOpen={activeModal === 'SEND_MESSAGE'}
            onClose={() => { setActiveModal(null); setSelectedSession(null); }}
            session={selectedSession}
            onSend={onSendMessage}
        />
    </div>
  );
};