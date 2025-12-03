
import React, { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { AppState, ViewType, SessionUI } from './types';
import { useBigConectApi } from './hooks/useBigConectApi';

// Layout & Views
import { Sidebar } from './components/dashboard/Sidebar';
import { SessionsView } from './components/dashboard/views/SessionsView';
import { ApiConfigView } from './components/dashboard/views/ApiConfigView';
import { SettingsView } from './components/dashboard/views/SettingsView';
import { WebhooksView } from './components/dashboard/views/WebhooksView';
import { AutomationsView } from './components/dashboard/views/AutomationsView';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
  const [currentView, setCurrentView] = useState<ViewType>('sessions');
  
  const [currentHost, setCurrentHost] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  
  // Hook handles API Logic
  const { 
    sessions, 
    systemStatus, 
    apiVersion, 
    isRefreshing,
    checkSystemStatus, 
    refreshSessions, 
    createSession,
    deleteSession,
    sendMessage,
    fetchQR
  } = useBigConectApi(currentHost, apiKey, appState === AppState.DASHBOARD);

  // --- Handlers ---

  const handleLoginSuccess = (loadedSessions: SessionUI[], host: string, key: string) => {
    setCurrentHost(host);
    setApiKey(key);
    setAppState(AppState.DASHBOARD);
  };

  const handleLogout = () => {
    if(confirm("Deseja realmente sair?")) {
        setAppState(AppState.LOGIN);
        setCurrentHost('');
        setApiKey('');
        setCurrentView('sessions');
    }
  };

  return (
    <div className="h-screen w-full bg-[#111B21] text-[#E9EDEF] overflow-hidden flex flex-col md:flex-row">
      
      {appState === AppState.LOGIN ? (
        <div className="w-full h-full flex items-center justify-center relative">
             <div className="absolute top-0 w-full h-32 bg-[#00A884] z-0 opacity-10 pointer-events-none"></div>
             <div className="z-10 w-full flex justify-center p-4">
                <LoginForm onSuccess={handleLoginSuccess} />
             </div>
        </div>
      ) : (
        <>
            {/* Sidebar Navigation */}
            <Sidebar 
                currentView={currentView}
                onChangeView={setCurrentView}
                onLogout={handleLogout}
            />

            {/* Main Content Area */}
            <main className="flex-1 h-full relative flex flex-col min-w-0">
                {/* Background Decoration */}
                <div className="absolute top-0 w-full h-32 bg-[#00A884] z-0 opacity-5 pointer-events-none"></div>

                <div className="z-10 h-full relative">
                    {currentView === 'sessions' && (
                        <SessionsView 
                            sessions={sessions}
                            systemStatus={systemStatus}
                            host={currentHost}
                            apiVersion={apiVersion}
                            isRefreshing={isRefreshing}
                            onRefresh={() => { checkSystemStatus(); refreshSessions(); }}
                            onCreateSession={createSession}
                            onDeleteSession={deleteSession}
                            onSendMessage={sendMessage}
                            onFetchQR={fetchQR}
                            onLogout={handleLogout}
                        />
                    )}

                    {currentView === 'webhooks' && (
                        <WebhooksView />
                    )}

                    {currentView === 'automations' && (
                        <AutomationsView 
                            sessions={sessions} 
                            host={currentHost}
                            apiKey={apiKey}
                        />
                    )}

                    {currentView === 'api_config' && (
                        <ApiConfigView 
                            host={currentHost}
                            apiKey={apiKey}
                            systemStatus={systemStatus}
                            apiVersion={apiVersion}
                        />
                    )}

                    {currentView === 'settings' && (
                        <SettingsView />
                    )}
                </div>
            </main>
        </>
      )}

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
            animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
