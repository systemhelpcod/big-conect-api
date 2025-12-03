import React, { useState, useMemo } from 'react';
import { LoginForm } from './components/LoginForm';
import { SessionCard } from './components/SessionCard';
import { AppState, SessionUI } from './types';
import { 
  LogOut, 
  RefreshCw, 
  LayoutGrid, 
  Search, 
  Plus, 
  Server, 
  Activity, 
  Smartphone,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { Button } from './components/ui/Button';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
  const [sessions, setSessions] = useState<SessionUI[]>([]);
  const [currentHost, setCurrentHost] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLoginSuccess = (loadedSessions: SessionUI[], host: string) => {
    setSessions(loadedSessions);
    setCurrentHost(host.replace(/^https?:\/\//, '')); // Show clean host
    setAppState(AppState.DASHBOARD);
  };

  const handleLogout = () => {
    setAppState(AppState.LOGIN);
    setSessions([]);
    setCurrentHost('');
    setSearchTerm('');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
        setIsRefreshing(false);
        // Here you would re-fetch data
    }, 1000);
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => 
      session.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      session.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sessions, searchTerm]);

  const stats = {
    total: sessions.length,
    online: sessions.filter(s => s.status === 'Conectado').length,
    attention: sessions.filter(s => s.status !== 'Conectado').length
  };

  // --- Render Login View ---
  if (appState === AppState.LOGIN) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#111B21] text-[#E9EDEF] relative overflow-hidden">
        <div className="fixed top-0 w-full h-1 bg-gradient-to-r from-[#00A884] to-[#00CC99] z-20"></div>
        {/* Background Patterns */}
        <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        <main className="flex-grow z-10 flex flex-col items-center justify-center p-4 sm:p-6">
          <div className="w-full flex justify-center animate-fade-in-up">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>
        </main>
        
        <footer className="z-10 p-6 text-center text-xs text-gray-500 font-mono">
          <p>BIG CONECT MANAGER &bull; v2.0.1 (Stable)</p>
        </footer>
      </div>
    );
  }

  // --- Render Dashboard View ---
  return (
    <div className="min-h-screen w-full bg-[#0b141a] text-[#E9EDEF] flex">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-20 lg:w-64 flex-col bg-[#111B21] border-r border-[#2A3942] fixed h-full z-30 transition-all duration-300">
        <div className="p-6 flex items-center gap-3 border-b border-[#2A3942]/50 h-20">
          <div className="w-8 h-8 rounded-lg bg-[#00A884] flex items-center justify-center shrink-0 shadow-lg shadow-[#00A884]/20">
            <LayoutGrid className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight hidden lg:block text-white">BigManager</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 hidden lg:block">Principal</div>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#202C33] text-[#00A884] font-medium border border-[#2A3942] lg:border-transparent">
            <Activity className="w-5 h-5" />
            <span className="hidden lg:block">Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-[#E9EDEF] hover:bg-[#202C33] transition-colors">
            <Server className="w-5 h-5" />
            <span className="hidden lg:block">Instância</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-[#E9EDEF] hover:bg-[#202C33] transition-colors">
            <ShieldCheck className="w-5 h-5" />
            <span className="hidden lg:block">Segurança</span>
          </a>
        </nav>

        <div className="p-4 border-t border-[#2A3942]/50">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#F15C6D] hover:bg-[#F15C6D]/10 transition-colors"
           >
             <LogOut className="w-5 h-5" />
             <span className="hidden lg:block font-medium">Desconectar</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-20 lg:ml-64 min-w-0 bg-[#0b141a]">
        
        {/* Top Header */}
        <header className="h-20 bg-[#111B21]/80 backdrop-blur-md border-b border-[#2A3942] sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden text-gray-400" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <Menu className="w-6 h-6" />
            </button>
            
            {/* Search Bar */}
            <div className="relative max-w-md w-full hidden sm:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#00A884] transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar sessão por nome ou ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#202C33] border border-[#2A3942] rounded-full pl-10 pr-4 py-2 text-sm text-[#E9EDEF] focus:outline-none focus:border-[#00A884] focus:ring-1 focus:ring-[#00A884] transition-all placeholder-gray-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs text-gray-400">Conectado a</span>
                <span className="text-sm font-bold text-[#E9EDEF]">{currentHost}</span>
             </div>
             <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00A884] to-[#00CC99] flex items-center justify-center text-[#111B21] font-bold shadow-lg shadow-[#00A884]/20 cursor-pointer hover:scale-105 transition-transform">
                AD
             </div>
          </div>
        </header>

        {/* Mobile Search (visible only on small screens) */}
        <div className="sm:hidden p-4 bg-[#111B21] border-b border-[#2A3942]">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar sessão..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#202C33] border border-[#2A3942] rounded-lg pl-10 pr-4 py-2 text-sm text-[#E9EDEF] focus:outline-none"
              />
            </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-8 animate-fade-in space-y-8">
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             {/* Total */}
             <div className="bg-[#202C33] p-5 rounded-xl border border-[#2A3942] flex items-center justify-between group hover:border-[#374248] transition-colors">
                <div>
                   <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Total de Sessões</p>
                   <h2 className="text-3xl font-bold text-white">{stats.total}</h2>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#2A3942] flex items-center justify-center text-gray-400 group-hover:text-[#E9EDEF] transition-colors">
                   <Smartphone className="w-6 h-6" />
                </div>
             </div>

             {/* Online */}
             <div className="bg-[#202C33] p-5 rounded-xl border border-[#2A3942] flex items-center justify-between group hover:border-[#00A884]/30 transition-colors relative overflow-hidden">
                <div className="relative z-10">
                   <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Online Agora</p>
                   <h2 className="text-3xl font-bold text-[#00A884]">{stats.online}</h2>
                </div>
                <div className="w-12 h-12 rounded-lg bg-[#00A884]/10 flex items-center justify-center text-[#00A884]">
                   <Activity className="w-6 h-6" />
                </div>
                <div className="absolute right-0 top-0 w-24 h-24 bg-[#00A884]/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
             </div>

             {/* Offline/Attention */}
             <div className="bg-[#202C33] p-5 rounded-xl border border-[#2A3942] flex items-center justify-between group hover:border-yellow-500/30 transition-colors">
                <div>
                   <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Requer Atenção</p>
                   <h2 className="text-3xl font-bold text-yellow-500">{stats.attention}</h2>
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                   <ShieldCheck className="w-6 h-6" />
                </div>
             </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <h2 className="text-xl font-bold flex items-center gap-2">
                Sessões Ativas
                <span className="px-2 py-0.5 rounded-full bg-[#202C33] text-xs font-normal text-gray-400 border border-[#2A3942]">
                   {filteredSessions.length}
                </span>
             </h2>
             <div className="flex gap-3 w-full sm:w-auto">
                <Button 
                   variant="secondary" 
                   onClick={handleRefresh}
                   isLoading={isRefreshing}
                   className="h-10 text-sm"
                   icon={<RefreshCw className="w-4 h-4" />}
                >
                   Atualizar
                </Button>
                <Button 
                   variant="primary" 
                   className="h-10 text-sm shadow-lg shadow-[#00A884]/10"
                   icon={<Plus className="w-4 h-4" />}
                   onClick={() => alert('Feature: Abrir modal de criação')}
                >
                   Nova Sessão
                </Button>
             </div>
          </div>

          {/* Sessions Grid */}
          {filteredSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-[#202C33]/50 rounded-2xl border border-[#2A3942] border-dashed">
                <div className="w-16 h-16 rounded-full bg-[#2A3942] flex items-center justify-center mb-4">
                   <Search className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-[#E9EDEF]">Nenhuma sessão encontrada</h3>
                <p className="text-gray-500 text-sm mt-1">Tente ajustar sua busca ou adicione uma nova sessão.</p>
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="mt-4 text-[#00A884] hover:underline text-sm"
                    >
                        Limpar filtros
                    </button>
                )}
            </div>
          )}

        </div>
      </div>

      {/* Styles for Animations */}
      <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.5s ease-out forwards;
        }
        .animate-fade-in {
            animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;