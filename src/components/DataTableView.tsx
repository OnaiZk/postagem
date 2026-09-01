import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Eye, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  Calendar, 
  FileSpreadsheet, 
  Layers, 
  Building2, 
  ArrowUpDown, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import { PostagemRecord } from '../types';
import { exportToExcel, exportToCSV, parseExcelFile } from '../services/excelService';
import { dbService } from '../services/db';

interface DataTableViewProps {
  records: PostagemRecord[];
  onOpenChecklist: () => void;
  onSelectRecord: (record: PostagemRecord) => void;
  onEditRecord: (record: PostagemRecord) => void;
  onDataChanged: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const DataTableView: React.FC<DataTableViewProps> = ({
  records,
  onOpenChecklist,
  onSelectRecord,
  onEditRecord,
  onDataChanged,
  searchTerm,
  setSearchTerm
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedGrafica, setSelectedGrafica] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof PostagemRecord>('data');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(records.map((r) => r.ano).filter(Boolean)));
    years.sort((a, b) => a.localeCompare(b));
    return years;
  }, [records]);

  const availableGraficas = useMemo(() => {
    const graficas = Array.from(new Set(records.map((r) => r.grafica).filter(Boolean)));
    graficas.sort();
    return graficas;
  }, [records]);

  // Filter and sort records
  const filteredAndSortedRecords = useMemo(() => {
    return records
      .filter((r) => {
        // Year filter
        if (selectedYear !== 'all' && r.ano !== selectedYear) return false;
        // Grafica filter
        if (selectedGrafica !== 'all' && r.grafica !== selectedGrafica) return false;
        // Status filter
        if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchOS = (r.protocolo_os_nf || '').toLowerCase().includes(q);
          const matchClient = (r.cliente || '').toLowerCase().includes(q);
          const matchCamp = (r.campanha || '').toLowerCase().includes(q);
          const matchGraf = (r.grafica || '').toLowerCase().includes(q);
          const matchDate = (r.data || '').toLowerCase().includes(q);
          const matchObs = (r.observacoes || '').toLowerCase().includes(q);
          if (!matchOS && !matchClient && !matchCamp && !matchGraf && !matchDate && !matchObs) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }

        const comp = String(valA).localeCompare(String(valB));
        return sortAsc ? comp : -comp;
      });
  }, [records, selectedYear, selectedGrafica, selectedStatus, searchTerm, sortField, sortAsc]);

  // Paginated records
  const totalPages = Math.ceil(filteredAndSortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRecords.slice(start, start + pageSize);
  }, [filteredAndSortedRecords, currentPage, pageSize]);

  const handleSort = (field: keyof PostagemRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleDelete = async (record: PostagemRecord) => {
    if (window.confirm(`Deseja realmente excluir o protocolo #${record.protocolo_os_nf || record.campanha}?`)) {
      await dbService.deleteRecord(record.id);
      onDataChanged();
    }
  };

  const handleExportFiltered = () => {
    exportToExcel(
      filteredAndSortedRecords,
      `POSTAGEM_FILTRADA_${selectedYear}_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const totalCartazesFiltrados = useMemo(() => {
    return filteredAndSortedRecords.reduce((acc, curr) => acc + (curr.quantidade || 0), 0);
  }, [filteredAndSortedRecords]);

  return (
    <div className="space-y-4">
      {/* Header filter and export bar */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-black tracking-tight text-zinc-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#FF4F00]" />
              Planilha Geral de Protocolos
            </h1>
            <p className="text-xs text-zinc-500">
              Visualização, filtros e exportação dos dados históricos e novos lançamentos
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
            <button
              onClick={handleExportFiltered}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-colors"
            >
              <Download className="w-4 h-4" /> Exportar Excel (.xlsx)
            </button>

            <button
              onClick={() => exportToCSV(filteredAndSortedRecords)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
            >
              CSV
            </button>

            <button
              onClick={onOpenChecklist}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FF4F00] hover:bg-[#e04500] text-black font-extrabold rounded-xl text-xs shadow transition-transform active:scale-95 ml-auto lg:ml-0"
            >
              <PlusCircle className="w-4 h-4" /> Novo Recebimento
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-100">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar OS, Cliente, Campanha..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#FF4F00] focus:bg-white"
            />
          </div>

          {/* Year select */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#FF4F00] focus:bg-white"
            >
              <option value="all">Ano: Todos (2017-2026)</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>Ano: {y}</option>
              ))}
            </select>
          </div>

          {/* Gráfica select */}
          <div>
            <select
              value={selectedGrafica}
              onChange={(e) => {
                setSelectedGrafica(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[#FF4F00] focus:bg-white"
            >
              <option value="all">Gráfica: Todas</option>
              {availableGraficas.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Status select */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-[#FF4F00] focus:bg-white"
            >
              <option value="all">Status: Todos</option>
              <option value="Conferido">Conferido</option>
              <option value="Pendente">Pendente</option>
              <option value="Divergência">Divergência</option>
              <option value="Avaria">Avaria</option>
            </select>
          </div>
        </div>

        {/* Counter Summary Strip */}
        <div className="flex items-center justify-between text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
          <div className="flex items-center gap-4">
            <span>
              Encontrados: <strong className="text-zinc-900 font-bold">{filteredAndSortedRecords.length.toLocaleString('pt-BR')}</strong> protocolos
            </span>
            <span>
              Volume Total: <strong className="text-[#FF4F00] font-black">{totalCartazesFiltrados.toLocaleString('pt-BR')}</strong> cartazes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Linhas por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-zinc-300 rounded-lg px-2 py-0.5 text-xs font-bold"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Interactive Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black text-white uppercase text-[10px] font-extrabold tracking-wider border-b border-zinc-800">
                <th className="py-3 px-3.5 cursor-pointer hover:text-[#FF4F00]" onClick={() => handleSort('data')}>
                  <div className="flex items-center gap-1">
                    Data / Hora <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5 cursor-pointer hover:text-[#FF4F00]" onClick={() => handleSort('protocolo_os_nf')}>
                  <div className="flex items-center gap-1">
                    OS / Protocolo <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5 cursor-pointer hover:text-[#FF4F00]" onClick={() => handleSort('grafica')}>
                  <div className="flex items-center gap-1">
                    Gráfica <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5 cursor-pointer hover:text-[#FF4F00]" onClick={() => handleSort('cliente')}>
                  <div className="flex items-center gap-1">
                    Cliente <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5 cursor-pointer hover:text-[#FF4F00]" onClick={() => handleSort('campanha')}>
                  <div className="flex items-center gap-1">
                    Campanha <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5 text-center cursor-pointer hover:text-[#FF4F00]" onClick={() => handleSort('layout')}>
                  <div className="flex items-center justify-center gap-1">
                    Layout <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5 text-right cursor-pointer hover:text-[#FF4F00]" onClick={() => handleSort('quantidade')}>
                  <div className="flex items-center justify-end gap-1">
                    Qtd Cartazes <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5 text-center">Fotos</th>
                <th className="py-3 px-3.5 text-center cursor-pointer hover:text-[#FF4F00]" onClick={() => handleSort('status')}>
                  <div className="flex items-center justify-center gap-1">
                    Status <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-zinc-400 text-sm">
                    Nenhum protocolo encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec) => (
                  <tr 
                    key={rec.id} 
                    className="hover:bg-orange-50/50 transition-colors group cursor-pointer"
                    onClick={() => onSelectRecord(rec)}
                  >
                    <td className="py-3 px-3.5 whitespace-nowrap text-zinc-600 font-medium">
                      {rec.data ? rec.data.split('-').reverse().join('/') : ''}
                      {rec.hora && <span className="text-[11px] text-zinc-400 block">{rec.hora}</span>}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap font-mono font-black text-[#FF4F00]">
                      #{rec.protocolo_os_nf || 'S/N'}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap font-bold text-zinc-800">
                      {rec.grafica || ''}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap font-bold text-zinc-900">
                      {rec.cliente || ''}
                    </td>

                    <td className="py-3 px-3.5 max-w-[220px] truncate text-zinc-700 font-medium" title={rec.campanha}>
                      {rec.campanha || ''}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap text-center text-zinc-700 font-bold">
                      {rec.layout || 1}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap text-right font-black text-zinc-900 text-sm">
                      {rec.quantidade.toLocaleString('pt-BR')}
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {rec.foto_nf && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                            NF
                          </span>
                        )}
                        {rec.foto_cartaz && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 rounded text-[10px] font-bold">
                            Cartaz
                          </span>
                        )}
                        {!rec.foto_nf && !rec.foto_cartaz && (
                          <span className="text-zinc-300"></span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        rec.status === 'Conferido' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        rec.status === 'Pendente' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {rec.status}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectRecord(rec)}
                          className="p-1.5 bg-zinc-100 hover:bg-black hover:text-white rounded-lg text-zinc-700 transition-colors"
                          title="Visualizar Detalhes"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditRecord(rec)}
                          className="p-1.5 bg-zinc-100 hover:bg-[#FF4F00] hover:text-black rounded-lg text-zinc-700 transition-colors"
                          title="Editar Registro"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rec)}
                          className="p-1.5 bg-zinc-100 hover:bg-rose-600 hover:text-white rounded-lg text-zinc-700 transition-colors"
                          title="Excluir Registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-zinc-50 p-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-zinc-500">
            Mostrando página <strong className="text-zinc-900">{currentPage}</strong> de <strong className="text-zinc-900">{totalPages}</strong> ({filteredAndSortedRecords.length.toLocaleString('pt-BR')} itens)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 font-bold"
            >
              « Primeiro
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-zinc-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-black text-white font-bold rounded-lg">
              {currentPage}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-zinc-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 font-bold"
            >
              Último »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
