import React from 'react';
import { Info } from 'lucide-react';
import { SessionUI } from '../../types';

interface StatsProps {
  sessions: SessionUI[];
}

export const Stats: React.FC<StatsProps> = ({ sessions }) => {
  const total = sessions.length;
  const online = sessions.filter(s => s.status === 'Conectado').length;
  const disconnected = sessions.filter(s => s.status === 'Desconectado').length;
  const qrScan = sessions.filter(s => s.status === 'QR Scan').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#202C33] p-4 rounded-xl border border-[#2A3942] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10"><Info className="w-12 h-12" /></div>
            <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Total</div>
            <div className="text-2xl font-bold text-white">{total}</div>
        </div>
        <div className="bg-[#202C33] p-4 rounded-xl border border-[#2A3942]">
            <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Online</div>
            <div className="text-2xl font-bold text-[#00A884]">{online}</div>
        </div>
        <div className="bg-[#202C33] p-4 rounded-xl border border-[#2A3942]">
            <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Desconectado</div>
            <div className="text-2xl font-bold text-[#F15C6D]">{disconnected}</div>
        </div>
        <div className="bg-[#202C33] p-4 rounded-xl border border-[#2A3942]">
            <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">QR Scan</div>
            <div className="text-2xl font-bold text-yellow-500">{qrScan}</div>
        </div>
    </div>
  );
};