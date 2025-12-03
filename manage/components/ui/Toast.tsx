import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, MessageCircle, AlertTriangle } from 'lucide-react';
import { ToastMessage, ToastType } from '../../types';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration === 0) return; // Keep alive

    const timer = setTimeout(() => {
      handleClose();
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300); // Wait for animation
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-[#00A884]" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-[#F15C6D]" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'message': return <MessageCircle className="w-5 h-5 text-[#00A884]" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success': return 'border-l-[#00A884]';
      case 'error': return 'border-l-[#F15C6D]';
      case 'warning': return 'border-l-yellow-500';
      case 'message': return 'border-l-[#00A884] bg-[#0b141a]'; // Darker bg for messages
      default: return 'border-l-blue-400';
    }
  };

  return (
    <div
      className={`
        w-full max-w-sm bg-[#202C33] border border-[#2A3942] border-l-4 rounded-lg shadow-xl pointer-events-auto flex overflow-hidden mb-3 transition-all duration-300 transform
        ${getStyles(toast.type)}
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      role="alert"
    >
      <div className="p-4 flex items-start gap-3 w-full">
        <div className="shrink-0 mt-0.5">
          {getIcon(toast.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#E9EDEF]">{toast.title}</h4>
          {toast.description && (
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">{toast.description}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="shrink-0 text-gray-500 hover:text-white transition-colors focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<{ toasts: ToastMessage[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col items-end pointer-events-none p-4 sm:p-0 w-full sm:w-auto">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};