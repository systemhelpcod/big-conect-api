import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [sessionName, setSessionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim()) return;

    setIsLoading(true);
    await onSubmit(sessionName);
    setIsLoading(false);
    setSessionName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#202C33] border border-[#2A3942] rounded-xl w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[#2A3942] flex justify-between items-center bg-[#111B21]">
            <h3 className="text-xl font-bold text-[#E9EDEF] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#00A884]" />
                Nova Sessão
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
            <p className="text-gray-400 mb-6 text-sm">
                Crie uma nova sessão para conectar um cliente. O nome será usado para identificação.
            </p>

            <Input 
                label="Nome do Cliente"
                placeholder="ex: Cliente Beta"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                autoFocus
            />

            <div className="flex gap-3 mt-6">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    Criar Sessão
                </Button>
            </div>
        </form>
      </div>
    </div>
  );
};