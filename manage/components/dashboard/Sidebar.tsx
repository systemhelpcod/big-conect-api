import React from 'react';
import { LayoutGrid, Server, Settings, LogOut, MessageSquare, Workflow, Radio } from 'lucide-react';
import { ViewType } from '../../types';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout }) => {
  const menuItems = [
    { id: 'sessions', label: 'Sessões', icon: <LayoutGrid className="w-5 h-5" /> },
    { id: 'webhooks', label: 'Webhooks', icon: <Radio className="w-5 h-5" /> },
    { id: 'automations', label: 'Automações', icon: <Workflow className="w-5 h-5" /> },
    { id: 'api_config', label: 'Configuração API', icon: <Server className="w-5 h-5" /> },
    { id: 'settings', label: 'Ajustes Manager', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-20 lg:w-64 bg-[#202C33] border-r border-[#2A3942] flex flex-col h-full transition-all duration-300">
      {/* Logo Area */}
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-[#2A3942]">
        <div className="w-10 h-10 bg-[#00A884] rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-[#00A884]/20">
            <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div className="hidden lg:block ml-3">
            <h1 className="font-bold text-[#E9EDEF] text-lg leading-tight">Big Conect</h1>
            <p className="text-xs text-[#00A884] font-medium">Manager Pro</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => (
            <button
                key={item.id}
                onClick={() => onChangeView(item.id as ViewType)}
                className={`
                    w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg transition-all duration-200 group
                    ${currentView === item.id 
                        ? 'bg-[#00A884]/10 text-[#00A884]' 
                        : 'text-gray-400 hover:bg-[#2A3942] hover:text-[#E9EDEF]'}
                `}
                title={item.label}
            >
                <div className={`${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-200`}>
                    {item.icon}
                </div>
                <span className="hidden lg:block font-medium">{item.label}</span>
                
                {/* Active Indicator Strip */}
                {currentView === item.id && (
                    <div className="absolute left-0 w-1 h-8 bg-[#00A884] rounded-r-full lg:hidden"></div>
                )}
            </button>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-[#2A3942]">
        <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg text-[#F15C6D] hover:bg-[#F15C6D]/10 transition-colors"
            title="Sair"
        >
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
};
