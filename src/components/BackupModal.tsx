import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  Loader2, 
  Zap, 
  Terminal,
  Sparkles,
  Trash2 
} from 'lucide-react';
import { PostagemRecord } from '../types';
import { dbService } from '../services/db';
import { convexService, CONVEX_URL } from '../services/convexService';
import { exportToExcel, parseExcelFile } from '../services/excelService';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: PostagemRecord[];
  onDataChanged: () => void;
  onEnableAutoSync: () => void;
  isAutoSyncActive: boolean;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  records,
  onDataChanged,
  onEnableAutoSync,
  isAutoSyncActive
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSyncToConvex = async () => {
    setLoading(true);
    setStatusMsg(null);
    setSyncProgress({ current: 0, total: records.length });

    try {
      const count = await convexService.batchSyncRecords(records, (current, total) => {
        setSyncProgress({ current, total });
      });
      setStatusMsg({
        type: 'success',
        text: `Sincronização concluída! ${count.toLocaleString('pt-BR')} registros foram sincronizados com a nuvem Convex (${CONVEX_URL}).`
      });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: `Erro ao sincronizar com o Convex: ${e.message}` });
    } finally {
      setLoading(false);
      setSyncProgress(null);
    }
  };

  const handlePullFromConvex = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const convexData = await convexService.fetchAllRecords();
      if (!convexData || convexData.length === 0) {
        throw new Error('Nenhum registro encontrado no Convex Cloud.');
      }
      const count = await dbService.replaceRecordsFromSpreadsheet(convexData);
      onDataChanged();
      setStatusMsg({
        type: 'success',
        text: `${count.toLocaleString('pt-BR')} registros baixados do Convex Cloud e sincronizados sem duplicidade!`
      });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: `Erro ao baixar do Convex: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    try {
      const jsonStr = JSON.stringify(records, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_postagem_eletromidia_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: 'Backup JSON baixado com sucesso!' });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: `Erro ao exportar JSON: ${e.message}` });
    }
  };

  const handleExportFullExcel = () => {
    try {
      exportToExcel(records, `ELETROMIDIA_POSTAGEM_COMPLETO_${new Date().toISOString().split('T')[0]}.xlsx`);
      setStatusMsg({ type: 'success', text: 'Planilha Excel completa exportada com sucesso!' });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: `Erro ao exportar Excel: ${e.message}` });
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMsg(null);
    try {
      const imported = await parseExcelFile(file);
      if (imported.length === 0) {
        throw new Error('Nenhum registro válido encontrado no arquivo.');
      }
      const count = await dbService.replaceRecordsFromSpreadsheet(imported);
      onDataChanged();
      convexService.batchSyncRecords(imported).catch(() => {});
      setStatusMsg({
        type: 'success',
        text: `Planilha sobreposta e sincronizada com sucesso! ${count.toLocaleString('pt-BR')} registros ativos (sem duplicidade).`
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Erro na importação: ${err.message}` });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMsg(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        throw new Error('O arquivo JSON deve conter uma lista de registros.');
      }
      const count = await dbService.replaceRecordsFromSpreadsheet(data);
      onDataChanged();
      convexService.batchSyncRecords(data).catch(() => {});
      setStatusMsg({
        type: 'success',
        text: `Backup restaurado e sobreposto com sucesso! ${count.toLocaleString('pt-BR')} registros ativos.`
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Erro na restauração: ${err.message}` });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleDeduplicate = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await dbService.deduplicateRecords();
      onDataChanged();
      if (res.removedCount > 0) {
        setStatusMsg({
          type: 'success',
          text: `Limpeza concluída! ${res.removedCount.toLocaleString('pt-BR')} registros duplicados foram removidos. Restam ${res.remainingCount.toLocaleString('pt-BR')} registros únicos.`
        });
      } else {
        setStatusMsg({
          type: 'success',
          text: `Nenhuma duplicidade encontrada. A base já possui ${res.remainingCount.toLocaleString('pt-BR')} registros únicos.`
        });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Erro ao limpar duplicidades: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    const confirmation = window.confirm(
      '⚠️ ATENÇÃO: Deseja realmente APAGAR TODOS os registros de postagem da base de dados?\n\nEsta ação deixará a tabela vazia (0 registros) para você importar uma nova planilha limpa do zero.'
    );
    if (!confirmation) return;

    setLoading(true);
    setStatusMsg(null);
    try {
      await dbService.clearAllRecords();
      await convexService.clearAllRecords().catch(() => {});
      onDataChanged();
      setStatusMsg({
        type: 'success',
        text: 'Base apagada com sucesso! A tabela está vazia (0 registros). Agora você pode importar sua nova planilha limpa.'
      });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Erro ao apagar registros: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    if (window.confirm('Deseja realmente restaurar os dados originais da planilha histórica (2017-2026)?')) {
      setLoading(true);
      try {
        const count = await dbService.resetToInitialData();
        onDataChanged();
        setStatusMsg({ type: 'success', text: `Banco restaurado com os ${count} registros originais!` });
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: `Erro ao resetar: ${err.message}` });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-black text-white p-5 flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FF4F00] text-black rounded-xl font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sincronização Automática & Convex Cloud</h2>
              <p className="text-xs text-zinc-400">Atualização em tempo real quando a planilha for editada</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {statusMsg && (
            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
              statusMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Auto-Sync da Planilha */}
          <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-300 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-400 text-black rounded-lg font-black">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-amber-950">Auto-Atualização da Planilha (.xlsx)</h3>
                  <p className="text-[11px] text-amber-800 font-medium">
                    O site atualiza automaticamente assim que alguém salvar alterações na planilha!
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                isAutoSyncActive ? 'bg-emerald-600 text-white animate-pulse' : 'bg-zinc-200 text-zinc-700'
              }`}>
                {isAutoSyncActive ? 'Ativo ✓' : 'Inativo'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                onClick={onEnableAutoSync}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-black shadow transition-transform active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-[#FECC14] fill-[#FECC14]" />
                <span>{isAutoSyncActive ? 'Alterar Planilha Vinculada' : 'Vincular Planilha Local (.xlsx)'}</span>
              </button>

              <div className="text-[11px] text-zinc-600 font-mono bg-white px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                <span>Via terminal: <strong className="text-black">npm run watch:excel</strong></span>
              </div>
            </div>
          </div>

          {/* Convex Cloud box */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-orange-800 uppercase block flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-[#FF4F00]" /> Nuvem Convex Vinculada
                </span>
                <span className="text-xs font-mono font-bold text-zinc-900 truncate block mt-0.5">
                  {CONVEX_URL}
                </span>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold">
                Online
              </span>
            </div>

            {syncProgress && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-700">
                  <span>Sincronizando com a nuvem...</span>
                  <span>{syncProgress.current} / {syncProgress.total}</span>
                </div>
                <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#FF4F00] h-full transition-all duration-200"
                    style={{ width: `${Math.round((syncProgress.current / syncProgress.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleSyncToConvex}
                disabled={loading}
                className="flex items-center justify-center gap-2 p-2.5 bg-[#FF4F00] hover:bg-[#e04500] text-black font-black rounded-xl text-xs shadow transition-transform active:scale-95 disabled:opacity-50"
              >
                {loading && syncProgress ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <CloudUpload className="w-4 h-4 text-black" />
                )}
                <span>Subir Base para Convex</span>
              </button>

              <button
                onClick={handlePullFromConvex}
                disabled={loading}
                className="flex items-center justify-center gap-2 p-2.5 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                <CloudDownload className="w-4 h-4 text-zinc-700" />
                <span>Baixar Dados do Convex</span>
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-600 mb-2">Exportar Planilhas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportFullExcel}
                className="flex items-center justify-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Exportar Planilha (.xlsx)
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-2 p-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 rounded-xl text-xs font-bold transition-colors"
              >
                <Download className="w-4 h-4 text-zinc-700" /> Backup Completo (.json)
              </button>
            </div>
          </div>

          {/* Import Options */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-600 mb-2">Importar / Mesclar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Importar Planilha Manual (.xlsx)</span>
                <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
              </label>

              <label className="flex items-center justify-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center">
                <RotateCcw className="w-4 h-4 text-purple-600" />
                <span>Restaurar Backup (.json)</span>
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
            </div>
          </div>

          {/* Danger / Clean tools zone */}
          <div className="pt-3 border-t border-zinc-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Ferramentas de Limpeza & Manutenção</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
              <button
                onClick={handleClearAll}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-900 rounded-xl text-xs font-black transition-colors"
                title="Apaga todos os registros para importar uma nova planilha limpa do zero"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Apagar Tudo (Zerar Base)</span>
              </button>

              <button
                onClick={handleDeduplicate}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-900 rounded-xl text-xs font-bold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Limpar Duplicidades</span>
              </button>

              <button
                onClick={handleResetToDefault}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 hover:text-amber-900 rounded-xl text-xs font-bold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Restaurar Original</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
