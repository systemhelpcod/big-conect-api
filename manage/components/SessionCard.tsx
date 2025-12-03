import React from 'react';
import { SessionUI } from '../types';
import { Smartphone, Wifi, WifiOff, QrCode, Clock, Battery, Send, Trash2, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';

interface SessionCardProps {
  session: SessionUI;
  onOpenQR: (session: SessionUI) => void;
  onTestMessage: (session: SessionUI) => void;
  onDelete: (session: SessionUI) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onOpenQR, onTestMessage, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Conectado': return 'text-[#00A884] bg-[#00A884]/10 border-[#00A884]/20';
      case 'QR Scan': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Conectado': return <Wifi className="w-3.5 h-3.5" />;
      case 'QR Scan': return <QrCode className="w-3.5 h-3.5" />;
      default: return <WifiOff className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-[#202C33] rounded-xl p-5 border border-[#2A3942] hover:border-[#00A884]/30 transition-all hover:shadow-lg hover:shadow-black/20 group flex flex-col h-full relative overflow-hidden">
      
      {/* Loading Overlay if deleting */}
      {session.isDeleting && (
        <div className="absolute inset-0 bg-[#202C33]/80 z-10 flex items-center justify-center backdrop-blur-sm">
           <div className="flex flex-col items-center text-[#F15C6D]">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span className="text-sm font-medium">Desconectando...</span>
           </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full flex items-center justify-center transition-colors ${
            session.status === 'Conectado' ? 'bg-[#00A884]/10 text-[#00A884]' : 'bg-[#111B21] text-gray-500'
          }`}>
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-[#E9EDEF] text-lg leading-tight truncate" title={session.name}>
                {session.name}
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-1 opacity-70 group-hover:opacity-100 transition-opacity truncate">
              ID: {session.id}
            </p>
          </div>
        </div>
        
        {session.status === 'Conectado' && session.battery !== undefined && (
          <div className="flex flex-col items-end gap-1 pl-2">
             <div className="flex items-center gap-1 text-xs font-medium text-[#00A884]">
               <Battery className="w-3.5 h-3.5" />
               <span>{session.battery}%</span>
             </div>
             <div className="w-8 h-1 bg-[#2A3942] rounded-full overflow-hidden">
                <div className="h-full bg-[#00A884]" style={{ width: `${session.battery}%` }}></div>
             </div>
          </div>
        )}
      </div>
      
      <div className="mb-6 flex items-center gap-2">
         <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border ${getStatusColor(session.status)}`}>
          {getStatusIcon(session.status)}
          {session.status}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
          <Clock className="w-3.5 h-3.5" />
          <span>{session.lastActivity}</span>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 pt-4 border-t border-[#2A3942]">
        <Button 
            variant="secondary" 
            onClick={() => onTestMessage(session)}
            title="Testar Envio"
            disabled={session.status !== 'Conectado' || session.isDeleting}
        >
            <Send className="w-4 h-4" />
        </Button>
        <Button 
            variant="secondary" 
            onClick={() => onOpenQR(session)}
            title="Ver QR Code"
            disabled={session.status === 'Conectado' || session.isDeleting}
        >
            <QrCode className="w-4 h-4" />
        </Button>
        <Button 
            variant="danger" 
            onClick={() => onDelete(session)}
            title="Desconectar e Excluir"
            disabled={session.isDeleting}
        >
            <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};