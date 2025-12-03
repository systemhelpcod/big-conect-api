import React from 'react';
import { SessionUI } from '../types';
import { Smartphone, Wifi, WifiOff, QrCode, Clock, MoreVertical, Power, RefreshCw, Settings, Battery, BatteryWarning, BatteryCharging } from 'lucide-react';

interface SessionCardProps {
  session: SessionUI;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const isConnected = session.status === 'Conectado';
  const isQrScan = session.status === 'QR Scan';

  const getBatteryIcon = (level?: number) => {
    if (level === undefined) return <Battery className="w-4 h-4 text-gray-500" />;
    if (level < 20) return <BatteryWarning className="w-4 h-4 text-red-500" />;
    if (level > 90) return <BatteryCharging className="w-4 h-4 text-green-400" />;
    return <Battery className="w-4 h-4 text-gray-400" />;
  };

  const getBatteryColor = (level?: number) => {
    if (level === undefined) return 'bg-gray-600';
    if (level < 20) return 'bg-red-500';
    if (level < 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="group relative bg-[#202C33] rounded-xl border border-[#2A3942] hover:border-[#00A884]/30 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 flex flex-col overflow-hidden">
      
      {/* Top Decoration Line */}
      <div className={`h-1 w-full ${isConnected ? 'bg-[#00A884]' : isQrScan ? 'bg-yellow-500' : 'bg-gray-600'}`} />

      <div className="p-5 flex-grow">
        {/* Header: Icon + Name + Menu */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${isConnected ? 'bg-[#00A884]/10 text-[#00A884]' : 'bg-[#2A3942] text-gray-400'}`}>
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#E9EDEF] text-base tracking-tight leading-tight">
                {session.name}
              </h3>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5 uppercase tracking-wide">
                {session.id}
              </p>
            </div>
          </div>
          
          <button className="text-gray-500 hover:text-[#E9EDEF] p-1 rounded-md hover:bg-[#2A3942] transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Status Badge & Battery */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
            ) : (
              <span className={`h-2.5 w-2.5 rounded-full ${isQrScan ? 'bg-yellow-500' : 'bg-gray-500'}`} />
            )}
            <span className={`text-xs font-medium ${isConnected ? 'text-green-400' : isQrScan ? 'text-yellow-500' : 'text-gray-400'}`}>
              {session.status}
            </span>
          </div>

          {session.battery !== undefined && (
            <div className="flex items-center gap-2" title={`Bateria: ${session.battery}%`}>
              <div className="w-8 h-1.5 bg-[#111B21] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${getBatteryColor(session.battery)}`} 
                  style={{ width: `${session.battery}%` }} 
                />
              </div>
              <span className="text-xs text-gray-400 font-mono">{session.battery}%</span>
            </div>
          )}
        </div>

        {/* Activity Info */}
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-[#111B21]/50 p-2 rounded-lg border border-[#2A3942]/50">
          <Clock className="w-3.5 h-3.5" />
          <span>Última atividade: <span className="text-gray-300">{session.lastActivity}</span></span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-[#2A3942] p-2 flex divide-x divide-[#2A3942]">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-gray-400 hover:text-[#E9EDEF] hover:bg-[#2A3942]/50 rounded transition-colors group">
          <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
          Reiniciar
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-gray-400 hover:text-yellow-400 hover:bg-[#2A3942]/50 rounded transition-colors">
          <Settings className="w-3.5 h-3.5" />
          Config
        </button>
        {isConnected ? (
           <button className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-gray-400 hover:text-red-400 hover:bg-[#2A3942]/50 rounded transition-colors">
             <Power className="w-3.5 h-3.5" />
             Sair
           </button>
        ) : (
           <button className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium text-[#00A884] hover:bg-[#2A3942]/50 rounded transition-colors">
             <QrCode className="w-3.5 h-3.5" />
             Ler QR
           </button>
        )}
      </div>
    </div>
  );
};