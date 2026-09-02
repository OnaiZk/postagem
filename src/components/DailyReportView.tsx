import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Copy, 
  Printer, 
  Share2, 
  Layers, 
  Building2, 
  Image as ImageIcon,
  Clock,
  PlusCircle,
  Eye,
  Edit3,
  Trash2,
  Check,
  Package
} from 'lucide-react';
import { PostagemRecord } from '../types';
import { syncService } from '../services/syncService';
import { Zap, RefreshCw } from 'lucide-react';

interface DailyReportViewProps {
  records: PostagemRecord[];
  onOpenChecklist: (record?: PostagemRecord) => void;
  onSelectRecord: (record: PostagemRecord) => void;
  onDeleteRecord?: (record: PostagemRecord) => void;
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({
  records,
  onOpenChecklist,
  onSelectRecord,
  onDeleteRecord
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const handleQuickSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncService.pullAndSyncWithServer();
      setSyncToast(`⚡ Sincronizado com a Central! ${res.syncedCount} registros atualizados.`);
      setTimeout(() => setSyncToast(null), 3500);
    } catch (err) {
      setSyncToast('Erro ao sincronizar.');
      setTimeout(() => setSyncToast(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter records for the chosen day
  const dayRecords = useMemo(() => {
    return records
      .filter((r) => r.data === selectedDate)
      .sort((a, b) => (b.hora || '').localeCompare(a.hora || ''));
  }, [records, selectedDate]);

  // Statistics for the chosen day
  const stats = useMemo(() => {
    const totalEntregas = dayRecords.length;
    const totalCartazes = dayRecords.reduce((acc, curr) => acc + (curr.quantidade || 0), 0);
    const graficas = new Set(dayRecords.map((r) => r.grafica).filter(Boolean)).size;
    const clientes = new Set(dayRecords.map((r) => r.cliente).filter(Boolean)).size;
    const conferidos = dayRecords.filter((r) => r.status === 'Conferido').length;
    const divergencias = dayRecords.filter((r) => r.status === 'Divergência' || r.status === 'Avaria').length;
    const pendentes = dayRecords.filter((r) => r.status === 'Pendente').length;

    return {
      totalEntregas,
      totalCartazes,
      graficas,
      clientes,
      conferidos,
      divergencias,
      pendentes
    };
  }, [dayRecords]);

  // Format text report for WhatsApp / Clipboard
  const generateWhatsAppReport = () => {
    const [year, month, day] = selectedDate.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    let text = `📦 *ELETROMIDIA - RELATÓRIO DIÁRIO DE RECEBIMENTO*\n`;
    text += `📅 *Data:* ${formattedDate}\n`;
    text += `------------------------------------\n`;
    text += `📊 *RESUMO DO DIA:*\n`;
    text += `• Total de Entregas/Notas: *${stats.totalEntregas}*\n`;
    text += `• Total de Cartazes: *${stats.totalCartazes.toLocaleString('pt-BR')} peças*\n`;
    text += `• Gráficas Atendidas: *${stats.graficas}*\n`;
    text += `• Clientes/Campanhas: *${stats.clientes}*\n`;
    text += `• Conferidos 100%: *${stats.conferidos}*\n`;
    if (stats.divergencias > 0) {
      text += `• ⚠️ Divergências/Avarias: *${stats.divergencias}*\n`;
    }
    if (stats.pendentes > 0) {
      text += `• ⏱ Pendentes: *${stats.pendentes}*\n`;
    }
    text += `------------------------------------\n\n`;
    text += `📋 *DETALHAMENTO DOS RECEBIMENTOS:*\n\n`;

    if (dayRecords.length === 0) {
      text += `_Nenhum recebimento registrado nesta data._\n`;
    } else {
      dayRecords.forEach((r, idx) => {
        const icon = r.status === 'Conferido' ? '✅' : r.status === 'Pendente' ? '⏱' : '⚠️';
        text += `${idx + 1}. ${icon} *OS/NF:* ${r.protocolo_os_nf || 'S/N'}\n`;
        text += `   • *Cliente:* ${r.cliente || 'N/I'}\n`;
        text += `   • *Campanha:* ${r.campanha || 'N/I'}\n`;
        text += `   • *Gráfica:* ${r.grafica || 'N/I'}\n`;
        text += `   • *Quantidade:* ${r.quantidade} cartazes (${r.layout || 1} layout)\n`;
        text += `   • *Hora:* ${r.hora || '--:--'} | *Status:* ${r.status}\n`;
        if (r.observacoes) {
          text += `   • *Obs:* ${r.observacoes}\n`;
        }
        text += `\n`;
      });
    }

    text += `_Relatório gerado via Eletromidia Postagem PWA_`;
    return text;
  };

  const handleCopyReport = () => {
    const reportText = generateWhatsAppReport();
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-black text-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-[#FF4F00] text-black rounded-xl sm:rounded-2xl font-black shadow-lg shrink-0">
            <ClipboardCheck className="w-6 sm:w-7 h-6 sm:h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-black tracking-tight text-white">
                Relatório Diário de Recebimento
              </h1>
              <span className="bg-[#FECC14] text-black text-[10px] sm:text-[11px] font-black uppercase px-2 sm:px-2.5 py-0.5 rounded-full">
                Turno Diário
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              Consolidação de materiais recebidos no galpão e prestação de contas diária
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 px-2.5 sm:px-3 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-[#FF4F00]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none"
            />
          </div>

          {/* Quick Realtime Sync Button */}
          <button
            onClick={handleQuickSync}
            disabled={isSyncing}
            title="Sincronizar em tempo real com o servidor e outros aparelhos"
            className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#FF4F00] ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Atualizando...' : 'Sincronizar'}</span>
          </button>

          {/* Copy for WhatsApp */}
          <button
            onClick={handleCopyReport}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 sm:gap-2 transition-all shadow-md active:scale-95 ${
              copied
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-[#FECC14] hover:bg-amber-400 text-black shadow-amber-500/20'
            }`}
          >
            {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            <span className="truncate">{copied ? 'Copiado!' : 'WhatsApp'}</span>
          </button>

          {/* Print Report */}
          <button
            onClick={handlePrint}
            className="px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 border border-zinc-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          {/* Novo Recebimento button */}
          <button
            onClick={() => onOpenChecklist()}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#FF4F00] hover:bg-[#ff621e] text-black font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Sync Toast */}
      {syncToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-between shadow-lg animate-fadeIn no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{syncToast}</span>
          </div>
          <button onClick={() => setSyncToast(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards for the Day */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-orange-50 border border-orange-200 text-[#FF4F00] flex items-center justify-center font-bold shrink-0">
            <Package className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase block truncate">Total Cartazes</span>
            <span className="text-lg sm:text-xl font-black text-zinc-900 leading-none truncate block">
              {stats.totalCartazes.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-purple-50 border border-purple-200 text-[#4E18FF] flex items-center justify-center font-bold shrink-0">
            <FileText className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase block truncate">Entregas / NFs</span>
            <span className="text-lg sm:text-xl font-black text-zinc-900 leading-none truncate block">
              {stats.totalEntregas}
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 border border-emerald-200 text-[#3D7700] flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase block truncate">Conferidos 100%</span>
            <span className="text-lg sm:text-xl font-black text-emerald-700 leading-none truncate block">
              {stats.conferidos}
            </span>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <AlertTriangle className="w-4 sm:w-5 h-4 sm:h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase block truncate">Divergências</span>
            <span className="text-lg sm:text-xl font-black text-rose-600 leading-none truncate block">
              {stats.divergencias}
            </span>
          </div>
        </div>
      </div>

      {/* List of Day's Records */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-zinc-50/50">
          <div>
            <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#FF4F00]" />
              Recebimentos de {selectedDate.split('-').reverse().join('/')}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {dayRecords.length === 0
                ? 'Nenhum material registrado nesta data.'
                : `${dayRecords.length} lote(s) conferido(s) no galpão.`}
            </p>
          </div>

          {dayRecords.length > 0 && (
            <span className="text-xs font-bold text-zinc-500 bg-white px-3 py-1 rounded-full border border-zinc-200">
              {stats.totalCartazes} cartazes totais
            </span>
          )}
        </div>

        {dayRecords.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
              <ClipboardCheck className="w-7 h-7 text-zinc-400" />
            </div>
            <h3 className="text-sm font-black text-zinc-800">Nenhum registro encontrado</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
              Não há notas ou pacotes cadastrados para a data selecionada ({selectedDate.split('-').reverse().join('/')}).
            </p>
            <button
              onClick={() => onOpenChecklist()}
              className="px-4 py-2 bg-[#FF4F00] hover:bg-[#ff621e] text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Fazer Primeiro Recebimento do Dia</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {dayRecords.map((r, index) => (
              <div
                key={r.id || index}
                className="p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Left: Thumbnail & Core Info */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  {/* Photo or Placeholder */}
                  <div
                    onClick={() => onSelectRecord(r)}
                    className="w-14 h-14 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center cursor-pointer shrink-0 group relative hover:border-[#FF4F00] transition-colors"
                  >
                    {r.foto_cartaz || r.foto_nf ? (
                      <img
                        src={r.foto_cartaz || r.foto_nf}
                        alt="Comprovante"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-zinc-400" />
                    )}
                  </div>

                  {/* Main Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-black text-sm text-[#FF4F00]">
                        #{r.protocolo_os_nf || 'S/N'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        r.status === 'Conferido'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'Pendente'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {r.status}
                      </span>
                      <span className="text-zinc-400 text-xs flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> {r.hora || '--:--'}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-zinc-900 truncate">
                      {r.campanha || 'Campanha Sem Nome'}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-zinc-600 font-medium flex-wrap mt-0.5">
                      <span className="font-bold text-zinc-800">{r.cliente}</span>
                      <span>•</span>
                      <span>Gráfica: <strong className="text-zinc-800">{r.grafica}</strong></span>
                      {r.observacoes && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-500 italic max-w-xs truncate">{r.observacoes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quantity & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <span className="block text-base font-black text-zinc-900">
                      {r.quantidade} <span className="text-xs font-bold text-zinc-500">peças</span>
                    </span>
                    <span className="text-[11px] font-medium text-zinc-400">
                      {r.layout || 1} motivo(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectRecord(r)}
                      title="Ver Detalhes e Fotos"
                      className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs flex items-center justify-center transition-colors shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenChecklist(r)}
                      title="Editar Checklist"
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center transition-colors border border-amber-200 shadow-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {onDeleteRecord && (
                      <button
                        onClick={() => onDeleteRecord(r)}
                        title="Excluir Checklist"
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center transition-colors border border-rose-200 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
