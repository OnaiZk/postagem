import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Package, 
  PlusCircle, 
  Search, 
  Filter, 
  LayoutGrid, 
  Table as TableIcon, 
  Download, 
  Building2, 
  Layers, 
  MapPin, 
  Eye, 
  Edit3, 
  Trash2, 
  Camera, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  ZoomIn,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { StockItem, StockStatus, StockMaterialType } from '../types';
import { dbService } from '../services/db';
import { StockFormModal } from './StockFormModal';
import { StockDetailModal } from './StockDetailModal';
import { exportStockToExcel } from '../services/excelService';

interface StockViewProps {
  onOpenChecklist?: () => void;
}

export const StockView: React.FC<StockViewProps> = () => {
  const rawStockItems = useQuery(api.stock.listStockItems, {});
  const stockItems: StockItem[] = useMemo(() => {
    if (!rawStockItems) return [];
    return rawStockItems.map((item: any) => ({
      id: item.stockId || item._id,
      cliente: item.cliente,
      campanha: item.campanha,
      grafica: item.grafica,
      tipo_material: item.tipo_material,
      quantidade_total: item.quantidade_total,
      quantidade_disponivel: item.quantidade_disponivel,
      quantidade_postada: item.quantidade_postada,
      localizacao: item.localizacao,
      lote_os: item.lote_os,
      data_entrada: item.data_entrada,
      tecnico_responsavel: item.tecnico_responsavel,
      status: item.status as any,
      observacoes: item.observacoes,
      fotos_layout: item.fotos_layout || [],
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  }, [rawStockItems]);

  const loading = rawStockItems === undefined;
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);


  // Clients list
  const availableClients = useMemo(() => {
    const set = new Set(stockItems.map((s) => s.cliente).filter(Boolean));
    return Array.from(set).sort();
  }, [stockItems]);

  // Filtered Stock Items
  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      // Status filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;

      // Client filter
      if (selectedClient !== 'all' && item.cliente !== selectedClient) return false;

      // Material filter
      if (selectedMaterial !== 'all' && item.tipo_material !== selectedMaterial) return false;

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCamp = (item.campanha || '').toLowerCase().includes(q);
        const matchClient = (item.cliente || '').toLowerCase().includes(q);
        const matchGraf = (item.grafica || '').toLowerCase().includes(q);
        const matchLoc = (item.localizacao || '').toLowerCase().includes(q);
        const matchLote = (item.lote_os || '').toLowerCase().includes(q);
        const matchTec = (item.tecnico_responsavel || '').toLowerCase().includes(q);
        if (!matchCamp && !matchClient && !matchGraf && !matchLoc && !matchLote && !matchTec) {
          return false;
        }
      }

      return true;
    });
  }, [stockItems, selectedStatus, selectedClient, selectedMaterial, searchTerm]);

  // KPIs
  const kpis = useMemo(() => {
    const totalPecas = stockItems.reduce((acc, curr) => acc + (curr.quantidade_disponivel || 0), 0);
    const totalPostadas = stockItems.reduce((acc, curr) => acc + (curr.quantidade_postada || 0), 0);
    const totalLayouts = stockItems.reduce((acc, curr) => acc + (curr.fotos_layout?.length || 0), 0);
    const baixoEstoque = stockItems.filter((s) => s.status === 'Baixo Estoque' || (s.quantidade_disponivel > 0 && s.quantidade_disponivel < 10)).length;
    const esgotados = stockItems.filter((s) => s.status === 'Esgotado' || s.quantidade_disponivel <= 0).length;

    return {
      totalPecas,
      totalPostadas,
      totalCampanhas: stockItems.length,
      totalLayouts,
      baixoEstoque,
      esgotados
    };
  }, [stockItems]);

  const handleQuickAdjust = async (
    item: StockItem,
    delta: number,
    tipo: 'Entrada' | 'Saída / Postagem na Rua'
  ) => {
    try {
      await dbService.quickAdjustStock(
        item.id,
        delta,
        tipo,
        'Técnico Galpão',
        delta > 0 ? 'Ajuste rápido (+)' : 'Baixa rápida para postagem (-)'
      );
      setToastMsg(
        delta > 0
          ? `+${delta} peças adicionadas a ${item.campanha}`
          : `-${Math.abs(delta)} peças baixadas de ${item.campanha}`
      );
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error('Erro no ajuste rápido:', err);
    }
  };

  const handleOpenNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: StockItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleSaved = (saved: StockItem) => {
    setToastMsg(`Estoque de "${saved.campanha}" salvo com sucesso!`);
    setTimeout(() => setToastMsg(null), 3500);
    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#FF4F00', '#FECC14', '#4E18FF']
      });
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#000000] text-white rounded-2xl p-5 border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FF4F00] text-black rounded-xl font-black shadow-md">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Estoque de Postagem & Layouts
              <span className="bg-[#FECC14] text-black text-[11px] font-black uppercase px-2 py-0.5 rounded-full">
                Galpão de Cartazes
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Controle físico de quantidades disponíveis, fotos de layouts/motivos e baixas para postagem na rua
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={() => exportStockToExcel(stockItems)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-bold transition-colors"
            title="Exportar dados de estoque para planilha Excel"
          >
            <Download className="w-4 h-4 text-[#FECC14]" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 bg-[#FF4F00] hover:bg-[#e04500] text-black font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-orange-600/30 transition-transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-black" />
            <span>Novo Cadastro de Estoque</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-xl font-bold text-xs flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total em Estoque */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Cartazes no Galpão</span>
          <div className="my-1">
            <span className="text-2xl font-black text-[#FF4F00]">
              {kpis.totalPecas.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-semibold text-zinc-500 ml-1">peças</span>
          </div>
          <span className="text-[11px] text-zinc-600 font-medium">Disponíveis p/ postar</span>
        </div>

        {/* Total Postadas na Rua */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Postados na Rua</span>
          <div className="my-1">
            <span className="text-2xl font-black text-zinc-900">
              {kpis.totalPostadas.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-semibold text-zinc-500 ml-1">peças</span>
          </div>
          <span className="text-[11px] text-zinc-600 font-medium">Instalados em abrigos</span>
        </div>

        {/* Campanhas Ativas */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Campanhas / Itens</span>
          <div className="my-1">
            <span className="text-2xl font-black text-[#4E18FF]">
              {kpis.totalCampanhas}
            </span>
            <span className="text-xs font-semibold text-zinc-500 ml-1">ativos</span>
          </div>
          <span className="text-[11px] text-zinc-600 font-medium">{availableClients.length} clientes únicos</span>
        </div>

        {/* Layouts / Motivos Fotografados */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Fotos de Layout</span>
          <div className="my-1">
            <span className="text-2xl font-black text-[#3D7700]">
              {kpis.totalLayouts}
            </span>
            <span className="text-xs font-semibold text-zinc-500 ml-1">motivos</span>
          </div>
          <span className="text-[11px] text-zinc-600 font-medium">Identificação visual</span>
        </div>

        {/* Alerta Baixo Estoque */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Atenção / Reposição</span>
          <div className="my-1 flex items-center gap-2">
            <span className={`text-2xl font-black ${kpis.baixoEstoque > 0 ? 'text-amber-600' : 'text-zinc-900'}`}>
              {kpis.baixoEstoque}
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              &lt; 10 pçs
            </span>
          </div>
          <span className="text-[11px] text-zinc-600 font-medium">{kpis.esgotados} esgotados</span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por campanha, cliente, localização, lote..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-300 text-xs rounded-xl pl-9 pr-4 py-2.5 text-zinc-900 focus:outline-none focus:border-[#FF4F00] focus:bg-white transition-colors font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-zinc-50 border border-zinc-300 text-xs font-bold rounded-xl px-3 py-2 text-zinc-800 focus:outline-none focus:border-[#FF4F00]"
          >
            <option value="all">Status: Todos</option>
            <option value="Disponível">Disponível</option>
            <option value="Baixo Estoque">Baixo Estoque (&lt; 10)</option>
            <option value="Esgotado">Esgotado</option>
            <option value="Reservado">Reservado</option>
          </select>

          {/* Client Filter */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-zinc-50 border border-zinc-300 text-xs font-bold rounded-xl px-3 py-2 text-zinc-800 focus:outline-none focus:border-[#FF4F00] max-w-[150px] truncate"
          >
            <option value="all">Cliente: Todos</option>
            {availableClients.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-black shadow-xs' : 'text-zinc-500 hover:text-black'
              }`}
              title="Visualização em Cards de Layouts"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-black shadow-xs' : 'text-zinc-500 hover:text-black'
              }`}
              title="Visualização em Tabela"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Stock Content Area */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <Package className="w-12 h-12 text-zinc-300" />
          <h3 className="text-sm font-bold text-zinc-800">Nenhum item de estoque encontrado</h3>
          <p className="text-xs text-zinc-500 max-w-sm">
            {searchTerm || selectedStatus !== 'all' || selectedClient !== 'all'
              ? 'Tente ajustar os filtros de busca para encontrar o material desejado.'
              : 'Clique no botão acima para cadastrar a primeira campanha com suas quantidades e fotos de layout.'}
          </p>
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 bg-[#FF4F00] text-black font-extrabold px-4 py-2 rounded-xl text-xs shadow-md mt-2"
          >
            <PlusCircle className="w-4 h-4" /> Cadastrar Estoque Agora
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* VISUAL LAYOUT CARDS GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const hasPhotos = item.fotos_layout && item.fotos_layout.length > 0;
            const primaryPhoto = hasPhotos ? item.fotos_layout[0].foto : null;
            const totalPhotos = item.fotos_layout?.length || 0;
            const pctAvailable = item.quantidade_total > 0
              ? Math.min(100, Math.round((item.quantidade_disponivel / item.quantidade_total) * 100))
              : 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-zinc-200 hover:border-orange-300 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Visual Layout Photo Header */}
                <div
                  className="relative h-48 bg-zinc-950 flex items-center justify-center cursor-pointer overflow-hidden border-b border-zinc-200"
                  onClick={() => setSelectedItem(item)}
                >
                  {primaryPhoto ? (
                    <img
                      src={primaryPhoto}
                      alt={item.campanha}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-500 text-xs">
                      <ImageIcon className="w-8 h-8 mb-1 text-zinc-600" />
                      <span>Sem foto do layout</span>
                    </div>
                  )}

                  {/* Badges on image */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow ${
                        item.status === 'Disponível'
                          ? 'bg-emerald-500 text-black'
                          : item.status === 'Baixo Estoque'
                          ? 'bg-amber-400 text-black'
                          : item.status === 'Esgotado'
                          ? 'bg-rose-600 text-white'
                          : 'bg-purple-600 text-white'
                      }`}
                    >
                      {item.status}
                    </span>

                    {totalPhotos > 1 && (
                      <span className="bg-black/80 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow">
                        {totalPhotos} Motivos
                      </span>
                    )}
                  </div>

                  {/* Lote / OS badge */}
                  {item.lote_os && (
                    <span className="absolute top-2 right-2 bg-black/80 text-white px-2 py-0.5 rounded-md text-[10px] font-mono font-bold">
                      #{item.lote_os}
                    </span>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition-opacity">
                    <ZoomIn className="w-4 h-4" /> Ver Detalhes & Layouts
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Cliente & Material */}
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-1">
                      <span className="text-[#FF4F00] truncate max-w-[140px]">{item.cliente}</span>
                      <span className="truncate max-w-[120px] text-zinc-400">{item.tipo_material.replace('Papel Abrigo (120x175)', 'Papel 120x175')}</span>
                    </div>

                    {/* Campanha */}
                    <h3
                      onClick={() => setSelectedItem(item)}
                      className="text-sm font-black text-zinc-900 leading-tight hover:text-[#FF4F00] cursor-pointer line-clamp-2"
                      title={item.campanha}
                    >
                      {item.campanha}
                    </h3>

                    {/* Localização Galpão */}
                    <div className="flex items-center gap-1 text-xs text-zinc-600 font-medium mt-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate" title={item.localizacao}>{item.localizacao}</span>
                    </div>
                  </div>

                  {/* Quantity & Stock Level */}
                  <div className="pt-2 border-t border-zinc-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500">Saldo Disponível:</span>
                      <span className="text-base font-black text-zinc-900">
                        {item.quantidade_disponivel}{' '}
                        <span className="text-[11px] font-normal text-zinc-500">/ {item.quantidade_total} pçs</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pctAvailable > 40
                            ? 'bg-[#FF4F00]'
                            : pctAvailable > 10
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${pctAvailable}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Action +/- Controls for Technicians */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-1">
                    {/* Fast Decrement / Baixa */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(item, -1, 'Saída / Postagem na Rua')}
                        disabled={item.quantidade_disponivel <= 0}
                        className="px-2 py-1 bg-zinc-100 hover:bg-rose-100 text-zinc-700 hover:text-rose-800 text-xs font-black rounded-lg disabled:opacity-30 transition-colors active:scale-95"
                        title="Baixar 1 cartaz para a rua"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(item, -5, 'Saída / Postagem na Rua')}
                        disabled={item.quantidade_disponivel < 5}
                        className="px-2 py-1 bg-zinc-100 hover:bg-rose-100 text-zinc-700 hover:text-rose-800 text-xs font-black rounded-lg disabled:opacity-30 transition-colors active:scale-95"
                        title="Baixar 5 cartazes para a rua"
                      >
                        -5
                      </button>
                    </div>

                    {/* Fast Increment / Entrada */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(item, 5, 'Entrada')}
                        className="px-2 py-1 bg-zinc-100 hover:bg-emerald-100 text-zinc-700 hover:text-emerald-800 text-xs font-black rounded-lg transition-colors active:scale-95"
                        title="Adicionar 5 cartazes recebidos"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(item, 10, 'Entrada')}
                        className="px-2 py-1 bg-zinc-100 hover:bg-emerald-100 text-zinc-700 hover:text-emerald-800 text-xs font-black rounded-lg transition-colors active:scale-95"
                        title="Adicionar 10 cartazes recebidos"
                      >
                        +10
                      </button>
                    </div>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs"
                      title="Editar cadastro completo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DETAILED TABLE VIEW */
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 uppercase text-[10px] font-black">
                  <th className="py-3 px-3 text-center">Layout</th>
                  <th className="py-3 px-3">Cliente / Campanha</th>
                  <th className="py-3 px-3">Material</th>
                  <th className="py-3 px-3">Localização</th>
                  <th className="py-3 px-3 text-right">Qtd Disponível</th>
                  <th className="py-3 px-3 text-right">Qtd Total</th>
                  <th className="py-3 px-3 text-right">Postadas</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Técnico</th>
                  <th className="py-3 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredItems.map((item) => {
                  const hasPhotos = item.fotos_layout && item.fotos_layout.length > 0;
                  const thumb = hasPhotos ? item.fotos_layout[0].foto : null;

                  return (
                    <tr key={item.id} className="hover:bg-orange-50/40 transition-colors">
                      {/* Thumbnail */}
                      <td className="py-2 px-3 text-center">
                        <div
                          className="w-10 h-10 rounded-lg bg-zinc-900 overflow-hidden mx-auto cursor-pointer flex items-center justify-center border border-zinc-200 shadow-xs"
                          onClick={() => setSelectedItem(item)}
                        >
                          {thumb ? (
                            <img src={thumb} alt="Layout" className="max-h-full max-w-full object-contain" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-zinc-500" />
                          )}
                        </div>
                      </td>

                      {/* Cliente & Campanha */}
                      <td className="py-2 px-3 max-w-xs">
                        <span className="text-[10px] font-black text-[#FF4F00] uppercase block">
                          {item.cliente}
                        </span>
                        <span
                          className="font-bold text-zinc-900 truncate block cursor-pointer hover:underline"
                          onClick={() => setSelectedItem(item)}
                          title={item.campanha}
                        >
                          {item.campanha}
                        </span>
                        {item.lote_os && (
                          <span className="text-[10px] text-zinc-400 font-mono">#{item.lote_os}</span>
                        )}
                      </td>

                      {/* Material */}
                      <td className="py-2 px-3 text-zinc-700 whitespace-nowrap font-medium">
                        {item.tipo_material}
                      </td>

                      {/* Localização */}
                      <td className="py-2 px-3 text-zinc-800 whitespace-nowrap font-semibold">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span>{item.localizacao}</span>
                        </div>
                      </td>

                      {/* Qtd Disponivel */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <span className="text-sm font-black text-zinc-900">
                          {item.quantidade_disponivel.toLocaleString('pt-BR')}
                        </span>{' '}
                        <span className="text-[10px] text-zinc-500">pçs</span>
                      </td>

                      {/* Qtd Total */}
                      <td className="py-2 px-3 text-right whitespace-nowrap text-zinc-600 font-medium">
                        {item.quantidade_total.toLocaleString('pt-BR')}
                      </td>

                      {/* Qtd Postada */}
                      <td className="py-2 px-3 text-right whitespace-nowrap text-zinc-600 font-medium">
                        {(item.quantidade_postada || 0).toLocaleString('pt-BR')}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Disponível'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'Baixo Estoque'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'Esgotado'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Tecnico */}
                      <td className="py-2 px-3 text-zinc-600 whitespace-nowrap">
                        {item.tecnico_responsavel}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-1.5 bg-zinc-100 hover:bg-black hover:text-white rounded-lg text-zinc-700 transition-colors"
                            title="Ver Detalhes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 bg-zinc-100 hover:bg-[#FF4F00] hover:text-black rounded-lg text-zinc-700 transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Form Modal */}
      <StockFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSaved={handleSaved}
        editingItem={editingItem}
      />

      {/* Stock Detail Modal */}
      <StockDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onEdit={(it) => {
          setSelectedItem(null);
          handleOpenEdit(it);
        }}
        onDeleted={() => {
          setSelectedItem(null);
          setToastMsg('Item excluído com sucesso.');
          setTimeout(() => setToastMsg(null), 3000);
        }}
        onUpdated={(updated) => setSelectedItem(updated)}
      />
    </div>
  );
};
