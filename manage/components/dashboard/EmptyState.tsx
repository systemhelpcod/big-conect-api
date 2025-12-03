import React from 'react';
import { Wifi } from 'lucide-react';
import { Button } from '../ui/Button';
import { SystemStatus } from '../../types';

interface EmptyStateProps {
  systemStatus: SystemStatus;
  onOpenCreate: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ systemStatus, onOpenCreate }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center py-20 bg-[#202C33]/50 rounded-2xl border-2 border-[#2A3942] border-dashed">
        <div className="p-4 bg-[#2A3942] rounded-full mb-4">
            <Wifi className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-xl font-medium text-[#E9EDEF]">Nenhuma sessão ativa</h3>
        <p className="text-gray-500 mt-2 mb-6 max-w-md">
            {systemStatus === 'OFFLINE' 
                ? 'O sistema está offline. Não é possível carregar sessões.'
                : 'Crie sua primeira sessão para começar a enviar mensagens e gerenciar seu WhatsApp.'}
        </p>
        <Button 
            variant="primary" 
            onClick={onOpenCreate}
            disabled={systemStatus === 'OFFLINE'}
        >
            Criar Primeira Sessão
        </Button>
    </div>
  );
};