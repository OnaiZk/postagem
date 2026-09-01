import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PostagemRecord } from './types';
import { dbService } from './services/db';
import { convexService } from './services/convexService';
import { parseExcelFile } from './services/excelService';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ChecklistFormView } from './components/ChecklistFormView';
import { DataTableView } from './components/DataTableView';
import { GraphicsReportView } from './components/GraphicsReportView';
import { RecordDetailModal } from './components/RecordDetailModal';
import { BackupModal } from './components/BackupModal';
import { Loader2, Zap } from 'lucide-react';

export const App: React.FC = () => {
  const [records, setRecords] = useState<PostagemRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals & Selected items
  const [selectedRecord, setSelectedRecord] = useState<PostagemRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<PostagemRecord | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState<boolean>(false);

  // Auto-Sync spreadsheet state
  const [isAutoSyncActive, setIsAutoSyncActive] = useState<boolean>(false);
  const [autoSyncToast, setAutoSyncToast] = useState<string | null>(null);
  const fileHandleRef = useRef<any>(null);
  const lastModifiedRef = useRef<number>(0);

  const loadRecords = useCallback(async () => {
    try {
      const data = await dbService.getAllRecords();
      setRecords(data);
    } catch (e) {
      console.error('Erro ao carregar registros:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
    const unsubscribe = dbService.subscribe(() => {
      loadRecords();
    });
    return () => unsubscribe();
  }, [loadRecords]);

  // File System Auto-Sync Watcher
  const handleEnableAutoSync = async () => {
    try {
      if ('showOpenFilePicker' in window) {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: 'Planilha Excel',
              accept: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.xls']
              }
            }
          ],
          multiple: false
        });

        fileHandleRef.current = handle;
        const initialFile = await handle.getFile();
        lastModifiedRef.current = initialFile.lastModified;
        setIsAutoSyncActive(true);
        setAutoSyncToast(`⚡ Auto-Sync ativado para: ${initialFile.name}`);
        setTimeout(() => setAutoSyncToast(null), 4000);
      } else {
        alert('Seu navegador não suporta a API de leitura em tempo real direta. Use o comando "npm run watch:excel" no terminal para monitoramento contínuo em segundo plano.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Erro ao ativar auto-sync:', err);
      }
    }
  };

  // Poll connected file handle every 2.5 seconds
  useEffect(() => {
    if (!isAutoSyncActive || !fileHandleRef.current) return;

    const interval = setInterval(async () => {
      try {
        const file = await fileHandleRef.current.getFile();
        if (file.lastModified > lastModifiedRef.current) {
          lastModifiedRef.current = file.lastModified;
          console.log('⚡ Modificação detectada na planilha vinculada! Atualizando...');
          const imported = await parseExcelFile(file);
          if (imported.length > 0) {
            await dbService.bulkAddRecords(imported);
            convexService.batchSyncRecords(imported).catch(() => {});
            setAutoSyncToast(`⚡ Planilha atualizada automaticamente! ${imported.length} registros sincronizados.`);
            setTimeout(() => setAutoSyncToast(null), 4000);
          }
        }
      } catch (e) {
        console.warn('Erro ao verificar planilha vinculada:', e);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isAutoSyncActive]);

  const handleOpenChecklist = (editRec?: PostagemRecord) => {
    if (editRec) {
      setEditingRecord(editRec);
    } else {
      setEditingRecord(null);
    }
    setActiveTab('checklist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecordSaved = (saved: PostagemRecord) => {
    setEditingRecord(null);
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setActiveTab('table');
  };

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-zinc-900 flex flex-col font-sans">
      {/* Top Navbar (Minimalist) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'checklist') setEditingRecord(null);
        }}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenChecklist={() => handleOpenChecklist()}
        onOpenBackup={() => setIsBackupOpen(true)}
        totalRecordsCount={records.length}
        isAutoSyncActive={isAutoSyncActive}
      />

      {/* Auto-Sync Toast notification */}
      {autoSyncToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-[#FECC14] border-2 border-[#FECC14] px-4 py-3 rounded-2xl shadow-2xl font-black text-xs flex items-center gap-2 animate-bounce">
          <Zap className="w-4 h-4 fill-[#FECC14]" />
          <span>{autoSyncToast}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-[#FF4F00] animate-spin" />
            <span className="text-sm font-bold text-zinc-600">Carregando base de postagem Eletromidia...</span>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                records={records}
                onOpenChecklist={() => handleOpenChecklist()}
                onOpenTable={() => setActiveTab('table')}
                onSelectRecord={(rec) => setSelectedRecord(rec)}
              />
            )}

            {activeTab === 'checklist' && (
              <ChecklistFormView
                existingRecords={records}
                onRecordSaved={handleRecordSaved}
                editingRecord={editingRecord}
                onCancelEdit={handleCancelEdit}
              />
            )}

            {activeTab === 'table' && (
              <DataTableView
                records={records}
                onOpenChecklist={() => handleOpenChecklist()}
                onSelectRecord={(rec) => setSelectedRecord(rec)}
                onEditRecord={(rec) => handleOpenChecklist(rec)}
                onDataChanged={loadRecords}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            )}

            {activeTab === 'reports' && (
              <GraphicsReportView records={records} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black text-zinc-400 text-xs border-t border-zinc-800 py-6 px-4 no-print mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4F00]" />
            <span className="font-bold text-white">Eletromidia</span>
            <span className="text-zinc-500">•</span>
            <span>Controle de Recebimento de Postagem em Abrigos</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-500">
            <span>Base Histórica 2017 - 2026</span>
            <span>•</span>
            <span>Nuvem Convex</span>
            <span>•</span>
            <span>PWA Instalável</span>
          </div>
        </div>
      </footer>

      {/* Detail Modal */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onEdit={(rec) => handleOpenChecklist(rec)}
        />
      )}

      {/* Backup / Excel Sync Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        records={records}
        onDataChanged={loadRecords}
        onEnableAutoSync={handleEnableAutoSync}
        isAutoSyncActive={isAutoSyncActive}
      />
    </div>
  );
};

export default App;
