import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Sector,
  Legend 
} from 'recharts';
import { 
  FileText, 
  Layers, 
  Building2, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Filter, 
  PlusCircle, 
  Eye, 
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';
import { PostagemRecord } from '../types';
import { KpiCard } from './KpiCard';
import { 
  calculateKPIs, 
  getMonthlyVolume, 
  getYearlyComparison, 
  getTopClients, 
  getGraficasDistribution, 
  getHourlyDistribution 
} from '../services/statsService';

interface DashboardViewProps {
  records: PostagemRecord[];
  onOpenChecklist: () => void;
  onOpenTable: () => void;
  onSelectRecord: (record: PostagemRecord) => void;
}

const PIE_COLORS = ['#FF4F00', '#4E18FF', '#FECC14', '#3D7700', '#F577ED', '#000000', '#71717A'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  onOpenChecklist,
  onOpenTable,
  onSelectRecord
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(records.map((r) => r.ano).filter(Boolean)));
    years.sort((a, b) => a.localeCompare(b));
    return years;
  }, [records]);

  // Filter records by year and period
  const filteredRecords = useMemo(() => {
    let result = records;
    if (selectedYear !== 'all') {
      result = result.filter((r) => r.ano === selectedYear);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);

    if (selectedPeriod === 'today') {
      result = result.filter((r) => r.data === todayStr);
    } else if (selectedPeriod === 'month') {
      result = result.filter((r) => r.data && r.data.startsWith(currentMonthStr));
    }
    return result;
  }, [records, selectedYear, selectedPeriod]);

  const kpis = useMemo(() => calculateKPIs(filteredRecords, 'all'), [filteredRecords]);
  const monthlyData = useMemo(() => getMonthlyVolume(filteredRecords, 'all'), [filteredRecords]);
  const yearlyData = useMemo(() => getYearlyComparison(records), [records]);
  const topClients = useMemo(() => getTopClients(filteredRecords, 'all', 8), [filteredRecords]);
  const graficasData = useMemo(() => getGraficasDistribution(filteredRecords, 'all'), [filteredRecords]);
  const hourlyData = useMemo(() => getHourlyDistribution(filteredRecords, 'all'), [filteredRecords]);

  const totalGraficasCartazes = useMemo(() => {
    return graficasData.reduce((acc, curr) => acc + curr.value, 0);
  }, [graficasData]);

  // Active shape for Donut slice hover
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g style={{ outline: 'none' }}>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#FFFFFF"
          strokeWidth={2}
          style={{ outline: 'none' }}
        />
      </g>
    );
  };

  // Custom tooltips
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const pct = totalGraficasCartazes > 0 ? ((data.value / totalGraficasCartazes) * 100).toFixed(1) : '0';
      return (
        <div className="bg-zinc-950 text-white text-xs p-3 rounded-xl shadow-2xl border border-zinc-800 pointer-events-none z-50">
          <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-zinc-800">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.payload?.fill || '#FF4F00' }} />
            <span className="font-black text-zinc-100 text-xs">{data.name}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-zinc-300">
              <span>Volume:</span>
              <span className="font-mono font-bold text-white">{Number(data.value).toLocaleString('pt-BR')} peças</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-zinc-400 text-[11px]">
              <span>Participação:</span>
              <span className="font-mono font-black text-[#FECC14]">{pct}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const VolumeBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-zinc-950 text-white text-xs p-3 rounded-xl shadow-2xl border border-zinc-800 pointer-events-none z-50">
          <p className="text-[11px] font-bold text-zinc-400 mb-1">
            {selectedYear === 'all' ? `Ano: ${label}` : `Mês: ${label}`}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF4F00]" />
            <span className="text-zinc-300">Cartazes:</span>
            <span className="font-mono font-black text-white">{Number(item.value).toLocaleString('pt-BR')} peças</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const TopClientsTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-zinc-950 text-white text-xs p-3 rounded-xl shadow-2xl border border-zinc-800 pointer-events-none z-50">
          <p className="text-xs font-black text-white mb-1.5 pb-1 border-b border-zinc-800">{item.payload?.cliente}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-zinc-300">
              <span>Volume de Peças:</span>
              <span className="font-mono font-black text-[#4E18FF]">{Number(item.value).toLocaleString('pt-BR')}</span>
            </div>
            {item.payload?.protocolos !== undefined && (
              <div className="flex items-center justify-between gap-4 text-zinc-400 text-[11px]">
                <span>Protocolos / Entregas:</span>
                <span className="font-mono font-bold text-zinc-200">{item.payload.protocolos}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const HourlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-zinc-950 text-white text-xs p-3 rounded-xl shadow-2xl border border-zinc-800 pointer-events-none z-50">
          <p className="text-[11px] font-bold text-zinc-400 mb-1.5 pb-1 border-b border-zinc-800">{item.payload?.faixa}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-zinc-300">
              <span>Entregas Recebidas:</span>
              <span className="font-mono font-black text-[#FECC14]">{item.value}</span>
            </div>
            {item.payload?.cartazes !== undefined && item.payload.cartazes > 0 && (
              <div className="flex items-center justify-between gap-4 text-zinc-400 text-[11px]">
                <span>Cartazes no Período:</span>
                <span className="font-mono font-bold text-zinc-200">{Number(item.payload.cartazes).toLocaleString('pt-BR')}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Latest 6 receipts
  const recentEntries = useMemo(() => {
    return [...filteredRecords].slice(0, 6);
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        {/* Year Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-zinc-500 uppercase mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Ano:
          </span>
          <button
            onClick={() => setSelectedYear('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              selectedYear === 'all'
                ? 'bg-black text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Todos (2017-2026)
          </button>
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                selectedYear === year
                  ? 'bg-[#FF4F00] text-black font-extrabold shadow-sm'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {year}
            </button>
          ))}
        </div>

        {/* Quick Period & Action */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl text-xs font-bold overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                selectedPeriod === 'all' ? 'bg-white text-black shadow-xs' : 'text-zinc-600 hover:text-black'
              }`}
            >
              Período Completo
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                selectedPeriod === 'month' ? 'bg-white text-black shadow-xs' : 'text-zinc-600 hover:text-black'
              }`}
            >
              Este Mês
            </button>
            <button
              onClick={() => setSelectedPeriod('today')}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                selectedPeriod === 'today' ? 'bg-white text-black shadow-xs' : 'text-zinc-600 hover:text-black'
              }`}
            >
              Hoje
            </button>
          </div>

          <button
            onClick={onOpenChecklist}
            className="flex items-center gap-1.5 bg-[#FF4F00] hover:bg-[#e04500] text-black font-black text-xs px-3.5 py-2 rounded-xl shadow-md active:scale-95 transition-transform shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Novo Registro</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <KpiCard
          title="Total de Protocolos"
          value={kpis.totalRegistros}
          subtitle={selectedYear === 'all' ? 'Histórico acumulado' : `Ano ${selectedYear}`}
          badgeText="Entradas"
          badgeColor="orange"
          icon={<FileText className="w-5 h-5" />}
          variant="primary"
        />

        <KpiCard
          title="Cartazes Recebidos"
          value={kpis.totalCartazes}
          subtitle="Peças para postagem"
          badgeText="Peças Totais"
          badgeColor="purple"
          icon={<Layers className="w-5 h-5" />}
          variant="black"
        />

        <KpiCard
          title="Clientes Atendidos"
          value={kpis.totalClientes}
          subtitle="Anunciantes e agências"
          badgeText="Únicos"
          badgeColor="green"
          icon={<Users className="w-5 h-5" />}
          variant="white"
        />

        <KpiCard
          title="Gráficas Parceiras"
          value={kpis.totalGraficas}
          subtitle="Fornecedores ativos"
          badgeText="Parceiros"
          badgeColor="yellow"
          icon={<Building2 className="w-5 h-5" />}
          variant="white"
        />
      </div>

      {/* Secondary Fast Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-zinc-200 shadow-sm text-xs">
        <div className="sm:border-r border-zinc-200 sm:pr-3">
          <span className="text-zinc-500 font-bold uppercase block text-[10px]">Hoje (Entradas)</span>
          <span className="text-base sm:text-lg font-black text-[#FF4F00]">
            {kpis.hojeRegistros} <span className="text-xs font-normal text-zinc-600">({kpis.hojeCartazes} pçs)</span>
          </span>
        </div>
        <div className="sm:border-r border-zinc-200 sm:pr-3">
          <span className="text-zinc-500 font-bold uppercase block text-[10px]">Mês Vigente</span>
          <span className="text-base sm:text-lg font-black text-zinc-900">
            {kpis.mesRegistros} <span className="text-xs font-normal text-zinc-600">({kpis.mesCartazes} pçs)</span>
          </span>
        </div>
        <div className="sm:border-r border-zinc-200 sm:pr-3">
          <span className="text-zinc-500 font-bold uppercase block text-[10px]">Conformidade</span>
          <span className="text-base sm:text-lg font-black text-emerald-700">{kpis.taxaConferido}% OK</span>
        </div>
        <div>
          <span className="text-zinc-500 font-bold uppercase block text-[10px]">Média / Entrega</span>
          <span className="text-base sm:text-lg font-black text-purple-700">
            {kpis.totalRegistros > 0 ? Math.round(kpis.totalCartazes / kpis.totalRegistros) : 0} peças
          </span>
        </div>
      </div>

      {/* Charts Row 1: Monthly / Yearly Volume + Donut Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Monthly evolution */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF4F00]" />
                {selectedYear === 'all' ? 'Evolução Anual de Cartazes (2017 - 2026)' : `Volume Mensal de Cartazes (${selectedYear})`}
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500">Distribuição temporal do volume de peças recebidas</p>
            </div>
            <span className="px-2.5 py-1 bg-orange-100 text-[#FF4F00] rounded-lg text-xs font-extrabold shrink-0">
              Total: {kpis.totalCartazes.toLocaleString('pt-BR')} peças
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {selectedYear === 'all' ? (
                <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                  <XAxis dataKey="ano" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<VolumeBarTooltip />} cursor={{ fill: 'rgba(255, 79, 0, 0.05)' }} />
                  <Bar dataKey="cartazes" fill="#FF4F00" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<VolumeBarTooltip />} cursor={{ fill: 'rgba(255, 79, 0, 0.05)' }} />
                  <Bar dataKey="cartazes" fill="#FF4F00" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Share by Gráfica */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-xs sm:text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#4E18FF]" /> Participação por Gráfica
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-500">Volume de cartazes por fornecedor</p>
          </div>

          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={graficasData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                  activeIndex={activePieIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActivePieIndex(index)}
                  onMouseLeave={() => setActivePieIndex(undefined)}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  style={{ outline: 'none' }}
                >
                  {graficasData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PIE_COLORS[index % PIE_COLORS.length]} 
                      style={{ outline: 'none' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom legend list with interactive hover */}
          <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto pr-1">
            {graficasData.map((item, idx) => (
              <div 
                key={item.name} 
                className={`flex items-center justify-between text-xs px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  activePieIndex === idx 
                    ? 'bg-orange-50 font-bold scale-[1.01]' 
                    : 'hover:bg-zinc-50'
                }`}
                onMouseEnter={() => setActivePieIndex(idx)}
                onMouseLeave={() => setActivePieIndex(undefined)}
              >
                <div className="flex items-center gap-2 truncate">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} 
                  />
                  <span className="truncate text-zinc-700 font-semibold">{item.name}</span>
                </div>
                <span className="font-mono text-zinc-900 font-bold ml-2">
                  {item.value.toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Top Clientes + Horários de Pico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Clientes */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#3D7700]" /> Top Clientes / Anunciantes
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500">Maiores volumes de postagem em abrigos</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topClients}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F4F4F5" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="cliente" type="category" tick={{ fontSize: 10, fontWeight: 700 }} width={90} />
                <Tooltip content={<TopClientsTooltip />} cursor={{ fill: 'rgba(78, 24, 255, 0.05)' }} />
                <Bar dataKey="cartazes" fill="#4E18FF" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Horários de Pico */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FECC14]" /> Horários de Pico no Galpão
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500">Distribuição de recebimento durante os turnos do dia</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                <XAxis dataKey="faixa" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<HourlyTooltip />} cursor={{ fill: 'rgba(254, 204, 20, 0.1)' }} />
                <Bar dataKey="count" fill="#FECC14" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Latest Receipts Table Preview */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FF4F00]" /> Últimos Protocolos Registrados
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-500">Visualização rápida das entradas mais recentes</p>
          </div>
          <button
            onClick={onOpenTable}
            className="flex items-center gap-1 text-xs font-bold text-[#FF4F00] hover:text-[#e04500] shrink-0"
          >
            Ver Planilha Completa <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-600 font-extrabold uppercase text-[10px]">
                <th className="py-2.5 px-3">Data / Hora</th>
                <th className="py-2.5 px-3">Protocolo / OS</th>
                <th className="py-2.5 px-3">Gráfica</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Campanha</th>
                <th className="py-2.5 px-3 text-right">Qtd Cartazes</th>
                <th className="py-2.5 px-3 text-center">Fotos</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentEntries.map((rec) => (
                <tr key={rec.id} className="hover:bg-orange-50/40 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap text-zinc-600 font-medium">
                    {rec.data ? rec.data.split('-').reverse().join('/') : ''}
                    {rec.hora && <span className="text-zinc-400 text-[11px] block">{rec.hora}</span>}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-[#FF4F00]">
                    #{rec.protocolo_os_nf || 'S/N'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-bold text-zinc-800">
                    {rec.grafica || ''}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-bold text-zinc-900">
                    {rec.cliente || ''}
                  </td>
                  <td className="py-2.5 px-3 max-w-[200px] truncate text-zinc-700 font-medium" title={rec.campanha}>
                    {rec.campanha || ''}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-right font-black text-zinc-900">
                    {rec.quantidade.toLocaleString('pt-BR')} <span className="text-[10px] font-normal text-zinc-500">pçs</span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      {rec.foto_nf && (
                        <span className="w-5 h-5 bg-emerald-100 text-emerald-800 rounded flex items-center justify-center text-[10px] font-bold" title="Foto da NF anexada">
                          NF
                        </span>
                      )}
                      {rec.foto_cartaz && (
                        <span className="w-5 h-5 bg-purple-100 text-purple-800 rounded flex items-center justify-center text-[10px] font-bold" title="Foto do Cartaz anexada">
                          CTZ
                        </span>
                      )}
                      {!rec.foto_nf && !rec.foto_cartaz && (
                        <span className="text-zinc-300"></span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rec.status === 'Conferido' ? 'bg-emerald-100 text-emerald-800' :
                      rec.status === 'Pendente' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-center">
                    <button
                      onClick={() => onSelectRecord(rec)}
                      className="p-1.5 bg-zinc-100 hover:bg-black hover:text-white rounded-lg text-zinc-700 transition-colors"
                      title="Ver Detalhes do Protocolo"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
