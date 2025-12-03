import React from 'react';
import { LayoutGrid, Plus, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
import { SystemStatus } from '../../types';

interface HeaderProps {
  systemStatus: SystemStatus;
  host: string;
  apiVersion: string;
  isRefreshing: boolean;
  onOpenCreate: () => void;
  onRefresh: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  host,
  apiVersion,
  isRefreshing,
  onOpenCreate,
  onRefresh,
  onLogout
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 border-b border-[#2A3942] pb-6">
      <div className="flex items-center gap-4">
         <div className="p-3 bg-[#202C33] rounded-xl border border-[#2A3942]">
            <LayoutGrid className="text-[#00A884] w-6 h-6" />
         </div>
         <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
                Painel de Controle
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                    systemStatus === 'ONLINE' 
                    ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                    {systemStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}
                </span>
            </h1>
            <p className="text-gray-400 text-sm flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${systemStatus === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                {host.replace('https://', '').replace('http://', '')}
                {apiVersion && <span className="opacity-50 border-l border-gray-600 pl-2 ml-1">v{apiVersion}</span>}
            </p>
         </div>
      </div>
      
      <div className="flex gap-3 w-full md:w-auto">
         <Button 
            variant="primary" 
            onClick={onOpenCreate}
            icon={<Plus className="w-4 h-4" />}
            disabled={systemStatus === 'OFFLINE'}
         >
            Nova Sessão
         </Button>
         <Button 
            variant="secondary" 
            onClick={onRefresh}
            isLoading={isRefreshing}
            icon={<RefreshCw className="w-4 h-4" />}
            disabled={systemStatus === 'OFFLINE'}
         >
            Atualizar
         </Button>
         <Button 
            variant="ghost" 
            onClick={onLogout}
            className="text-[#F15C6D] hover:bg-[#F15C6D]/10 hover:text-[#F15C6D]"
            icon={<LogOut className="w-4 h-4" />}
         >
            Sair
         </Button>
      </div>
    </div>
  );
};