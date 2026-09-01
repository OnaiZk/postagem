import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  Layers, 
  FileText, 
  Download, 
  Calendar, 
  BarChart2, 
  TrendingUp,
  PieChart as PieIcon
} from 'lucide-react';
import { PostagemRecord } from '../types';
import { exportToExcel } from '../services/excelService';

interface GraphicsReportViewProps {
  records: PostagemRecord[];
}

export const GraphicsReportView: React.FC<GraphicsReportViewProps> = ({ records }) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(records.map((r) => r.ano).filter(Boolean)));
    years.sort((a, b) => a.localeCompare(b));
    return years;
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (selectedYear === 'all') return records;
    return records.filter((r) => r.ano === selectedYear);
  }, [records, selectedYear]);

  // Supplier Breakdown
  const supplierStats = useMemo(() => {
    const map: { [name: string]: { name: string; protocolos: number; cartazes: number; topClient: string; clientCounts: { [c: string]: number } } } = {};

    filteredRecords.forEach((r) => {
      const g = (r.grafica || 'NÃO INFORMADA').trim().toUpperCase();
      if (!map[g]) {
        map[g] = { name: g, protocolos: 0, cartazes: 0, topClient: '', clientCounts: {} };
      }
      map[g].protocolos += 1;
      map[g].cartazes += (r.quantidade || 0);

      const c = (r.cliente || '').trim().toUpperCase();
      if (c) {
        map[g].clientCounts[c] = (map[g].clientCounts[c] || 0) + (r.quantidade || 0);
      }
    });

    return Object.values(map).map((item) => {
      let maxClient = '-';
      let maxVol = 0;
      for (const [c, vol] of Object.entries(item.clientCounts)) {
        if (vol > maxVol) {
          maxVol = vol;
          maxClient = c;
        }
      }
      return {
        ...item,
        topClient: maxClient,
        mediaPorEntrega: item.protocolos > 0 ? Math.round(item.cartazes / item.protocolos) : 0
      };
    }).sort((a, b) => b.cartazes - a.cartazes);
  }, [filteredRecords]);

  // Client Breakdown
  const clientStats = useMemo(() => {
    const map: { [name: string]: { name: string; protocolos: number; cartazes: number; topGrafica: string; graficaCounts: { [g: string]: number } } } = {};

    filteredRecords.forEach((r) => {
      const c = (r.cliente || 'NÃO INFORMADO').trim().toUpperCase();
      if (!map[c]) {
        map[c] = { name: c, protocolos: 0, cartazes: 0, topGrafica: '', graficaCounts: {} };
      }
      map[c].protocolos += 1;
      map[c].cartazes += (r.quantidade || 0);

      const g = (r.grafica || '').trim().toUpperCase();
      if (g) {
        map[c].graficaCounts[g] = (map[c].graficaCounts[g] || 0) + (r.quantidade || 0);
      }
    });

    return Object.values(map).map((item) => {
      let maxGrafica = '';
      let maxVol = 0;
      for (const [g, vol] of Object.entries(item.graficaCounts)) {
        if (vol > maxVol) {
          maxVol = vol;
          maxGrafica = g;
        }
      }
      return {
        ...item,
        topGrafica: maxGrafica,
        mediaPorEntrega: item.protocolos > 0 ? Math.round(item.cartazes / item.protocolos) : 0
      };
    }).sort((a, b) => b.cartazes - a.cartazes);
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black tracking-tight text-zinc-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#4E18FF]" />
            Relatórios por Gráfica & Cliente
          </h1>
          <p className="text-xs text-zinc-500">
            Análise consolidada de fornecimento e distribuição de postagem em abrigos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs font-bold text-zinc-800 focus:outline-none focus:border-[#FF4F00]"
          >
            <option value="all">Ano: Histórico Completo</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>Ano: {y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Supplier Section */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#FF4F00]" /> Ranking de Gráficas Fornecedoras
            </h2>
            <p className="text-xs text-zinc-500">Volume total de cartazes e protocolos entregues no galpão</p>
          </div>
          <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-3 py-1 rounded-full">
            {supplierStats.length} gráficas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-extrabold uppercase text-[10px]">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Gráfica / Fornecedor</th>
                <th className="py-2.5 px-3 text-right">Protocolos</th>
                <th className="py-2.5 px-3 text-right">Total Cartazes</th>
                <th className="py-2.5 px-3 text-right">Média / Entrega</th>
                <th className="py-2.5 px-3">Principal Cliente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {supplierStats.map((item, idx) => (
                <tr key={item.name} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-400">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-black text-zinc-900">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-zinc-700">
                    {item.protocolos.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-[#FF4F00] text-sm">
                    {item.cartazes.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-800">
                    {item.mediaPorEntrega} pçs
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-700">
                    {item.topClient}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Section */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#4E18FF]" /> Ranking de Clientes & Anunciantes
            </h2>
            <p className="text-xs text-zinc-500">Volume total de material veiculado em abrigos</p>
          </div>
          <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-3 py-1 rounded-full">
            {clientStats.length} clientes
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-extrabold uppercase text-[10px] sticky top-0">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Cliente / Exibidora</th>
                <th className="py-2.5 px-3 text-right">Protocolos</th>
                <th className="py-2.5 px-3 text-right">Total Cartazes</th>
                <th className="py-2.5 px-3 text-right">Média / Entrega</th>
                <th className="py-2.5 px-3">Gráfica Mais Utilizada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {clientStats.slice(0, 30).map((item, idx) => (
                <tr key={item.name} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-400">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-black text-zinc-900">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-zinc-700">
                    {item.protocolos.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-[#4E18FF] text-sm">
                    {item.cartazes.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-800">
                    {item.mediaPorEntrega} pçs
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-700">
                    {item.topGrafica}
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
