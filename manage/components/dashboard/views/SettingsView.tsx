import React, { useState } from 'react';
import { Settings, Bell, Volume2, Moon, RefreshCw } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    darkMode: true,
    autoRefresh: true
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-[#111B21] animate-fade-in">
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-[#E9EDEF] mb-6 flex items-center gap-3">
                <Settings className="text-[#00A884]" /> Ajustes do Manager
            </h2>

            <div className="bg-[#202C33] border border-[#2A3942] rounded-xl overflow-hidden divide-y divide-[#2A3942]">
                
                {/* Notifications */}
                <div className="p-5 flex items-center justify-between hover:bg-[#2A3942]/30 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-[#E9EDEF] font-medium">Notificações Toast</h4>
                            <p className="text-sm text-gray-400">Exibir popups de status e mensagens.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => toggle('notifications')}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${settings.notifications ? 'bg-[#00A884]' : 'bg-[#2A3942]'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings.notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>

                {/* Sound */}
                <div className="p-5 flex items-center justify-between hover:bg-[#2A3942]/30 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                            <Volume2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-[#E9EDEF] font-medium">Efeitos Sonoros</h4>
                            <p className="text-sm text-gray-400">Tocar som ao receber mensagens (Simulação).</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => toggle('sound')}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${settings.sound ? 'bg-[#00A884]' : 'bg-[#2A3942]'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings.sound ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>

                {/* Auto Refresh */}
                <div className="p-5 flex items-center justify-between hover:bg-[#2A3942]/30 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-[#E9EDEF] font-medium">Auto Atualização</h4>
                            <p className="text-sm text-gray-400">Atualizar lista de sessões a cada 25s.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => toggle('autoRefresh')}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${settings.autoRefresh ? 'bg-[#00A884]' : 'bg-[#2A3942]'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings.autoRefresh ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>

                {/* Dark Mode (Disabled/Fixed) */}
                <div className="p-5 flex items-center justify-between opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-700/50 text-gray-300 rounded-lg">
                            <Moon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-[#E9EDEF] font-medium">Tema Escuro</h4>
                            <p className="text-sm text-gray-400">Gerenciado pelo sistema.</p>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 font-bold px-2 py-1 bg-[#111B21] rounded">ATIVO</div>
                </div>

            </div>
        </div>
    </div>
  );
};