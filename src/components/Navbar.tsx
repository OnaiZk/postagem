import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Table as TableIcon, 
  Building2, 
  Download, 
  Plus, 
  Cloud
} from 'lucide-react';
import { convexService } from '../services/convexService';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  onOpenChecklist: () => void;
  onOpenBackup: () => void;
  totalRecordsCount: number;
  isAutoSyncActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenChecklist,
  onOpenBackup,
  totalRecordsCount,
  isAutoSyncActive
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isConvexOnline, setIsConvexOnline] = useState<boolean>(true);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    convexService.checkConnection().then((connected) => setIsConvexOnline(connected));

    const handleOnline = () => {
      convexService.checkConnection().then((connected) => setIsConvexOnline(connected));
    };
    const handleOffline = () => {
      setIsConvexOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      alert('Para instalar o App no seu dispositivo, utilize a opção "Adicionar à Tela de Início" ou o ícone de instalação na barra do navegador.');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'checklist', label: 'Checklist Diário', icon: ClipboardCheck },
    { id: 'table', label: 'Planilha Geral', icon: TableIcon, count: totalRecordsCount },
    { id: 'reports', label: 'Gráficas & Clientes', icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0c0c0e]/95 backdrop-blur-md text-white border-b border-zinc-800/80 shadow-md select-none">
      {/* Subtle top brand accent line */}
      <div className="h-[2px] w-full bg-[#FF4F00]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          
          {/* Left Area: Logo + Nav Tabs */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {/* Brand / Logo */}
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-[#FF4F00] flex items-center justify-center shadow-sm group-hover:brightness-110 transition-all">
                <img 
                  src="/assets/LOGOELETRO.png" 
                  alt="Eletromidia" 
                  className="h-4.5 w-auto object-contain brightness-0 invert"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight group-hover:text-zinc-200 transition-colors">
                  eletromidia
                </span>
                <span className="text-zinc-600 font-light text-sm hidden sm:inline">/</span>
                <span className="text-xs font-medium text-zinc-400 hidden sm:inline">Postagem</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800/80 shrink-0">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`h-8 px-3.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all duration-150 ${
                      isActive
                        ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700 font-semibold'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF4F00]' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full hidden xl:inline ${
                        isActive ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-800/80 text-zinc-400'
                      }`}>
                        {item.count > 999 ? `${(item.count / 1000).toFixed(1)}k` : item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Area: Minimalist Action Controls (Same height h-9, matching styling) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Cloud Sync / Backup */}
            <button
              onClick={onOpenBackup}
              title={isAutoSyncActive ? 'Auto-Sync Excel & Convex ativo' : 'Sincronização Convex & Backup'}
              className="h-9 px-3.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all flex items-center gap-2 text-xs font-medium active:scale-95"
            >
              <Cloud className={`w-3.5 h-3.5 ${isConvexOnline ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <span className="hidden sm:inline">Sincronizar</span>
              {isAutoSyncActive && (
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FECC14] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FECC14]" />
                </span>
              )}
            </button>

            {/* PWA Install */}
            {!isInstalled && (
              <button
                onClick={handleInstallPWA}
                title="Instalar aplicativo (PWA)"
                className="h-9 px-3.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all flex items-center gap-1.5 text-xs font-medium active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Instalar</span>
              </button>
            )}

            {/* Primary Action: Novo Recebimento */}
            <button
              onClick={onOpenChecklist}
              className="h-9 px-3.5 rounded-lg bg-[#FF4F00] hover:bg-[#ff621e] text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Novo Recebimento</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
