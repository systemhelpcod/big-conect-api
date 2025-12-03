import React, { useEffect, useState } from 'react';
import { X, RefreshCw, Smartphone } from 'lucide-react';
import { Button } from '../ui/Button';
import { SessionUI } from '../../types';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionUI | null;
  onRefresh: (sessionId: string) => Promise<string | null>;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, session, onRefresh }) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQR = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
        const qrString = await onRefresh(session.id);
        if (qrString) {
            setQrCode(qrString);
        } else {
            setError('Não foi possível obter o QR Code. A sessão pode já estar conectada.');
        }
    } catch (err) {
        setError('Erro ao carregar QR Code');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && session) {
        setQrCode(null);
        fetchQR();
        
        // Auto refresh every 15s
        const interval = setInterval(fetchQR, 15000);
        return () => clearInterval(interval);
    }
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#202C33] border border-[#2A3942] rounded-xl w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col items-center">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
        </button>

        <div className="pt-8 pb-4 text-center px-6">
            <h3 className="text-xl font-bold text-[#E9EDEF]">Escaneie o QR Code</h3>
            <p className="text-gray-400 text-sm mt-2">
                Abra o WhatsApp {'>'} Menu {'>'} Dispositivos conectados {'>'} Conectar
            </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-inner mb-6 mx-6 min-h-[250px] flex items-center justify-center relative w-[280px] h-[280px]">
            {loading && !qrCode && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <RefreshCw className="w-10 h-10 text-[#00A884] animate-spin" />
                </div>
            )}
            
            {error ? (
                <div className="text-center text-red-500 text-sm p-4">
                    <p>{error}</p>
                    <Button variant="secondary" onClick={fetchQR} className="mt-4 text-xs">Tentar Novamente</Button>
                </div>
            ) : qrCode ? (
                // Use a public API to render the QR string into an image
                <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCode)}`} 
                    alt="Scan Me" 
                    className="w-full h-full object-contain"
                />
            ) : null}
            
            {/* Overlay icon */}
            {!loading && qrCode && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="bg-white p-1 rounded-full shadow-md">
                        <Smartphone className="w-6 h-6 text-[#00A884]" />
                     </div>
                </div>
            )}
        </div>

        <div className="w-full bg-[#111B21] p-4 text-center border-t border-[#2A3942]">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Atualiza automaticamente
            </p>
        </div>
      </div>
    </div>
  );
};