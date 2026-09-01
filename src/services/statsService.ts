import { PostagemRecord, DashboardKPIs } from '../types';

export const calculateKPIs = (records: PostagemRecord[], selectedYear = 'all'): DashboardKPIs => {
  const filtered = selectedYear === 'all' 
    ? records 
    : records.filter((r) => r.ano === selectedYear);

  const totalRegistros = filtered.length;
  const totalCartazes = filtered.reduce((acc, curr) => acc + (curr.quantidade || 0), 0);

  const clientesSet = new Set<string>();
  const graficasSet = new Set<string>();
  let conferidosCount = 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  let hojeRegistros = 0;
  let hojeCartazes = 0;
  let mesRegistros = 0;
  let mesCartazes = 0;

  filtered.forEach((r) => {
    if (r.cliente && r.cliente.trim()) clientesSet.add(r.cliente.trim().toUpperCase());
    if (r.grafica && r.grafica.trim()) graficasSet.add(r.grafica.trim().toUpperCase());
    if (r.status === 'Conferido') conferidosCount++;

    if (r.data === todayStr) {
      hojeRegistros++;
      hojeCartazes += (r.quantidade || 0);
    }
    if (r.data && r.data.startsWith(currentMonthStr)) {
      mesRegistros++;
      mesCartazes += (r.quantidade || 0);
    }
  });

  const taxaConferido = totalRegistros > 0 
    ? Math.round((conferidosCount / totalRegistros) * 100) 
    : 100;

  return {
    totalRegistros,
    totalCartazes,
    totalClientes: clientesSet.size,
    totalGraficas: graficasSet.size,
    hojeRegistros,
    hojeCartazes,
    mesRegistros,
    mesCartazes,
    taxaConferido
  };
};

export const getMonthlyVolume = (records: PostagemRecord[], selectedYear = 'all') => {
  const filtered = selectedYear === 'all' 
    ? records 
    : records.filter((r) => r.ano === selectedYear);

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const data = months.map((m, idx) => ({
    mes: m,
    mesNum: idx + 1,
    cartazes: 0,
    protocolos: 0
  }));

  filtered.forEach((r) => {
    if (!r.data) return;
    const parts = r.data.split('-');
    if (parts.length >= 2) {
      const mIdx = parseInt(parts[1], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        data[mIdx].cartazes += (r.quantidade || 0);
        data[mIdx].protocolos += 1;
      }
    }
  });

  return data;
};

export const getYearlyComparison = (records: PostagemRecord[]) => {
  const yearMap: { [year: string]: { ano: string; cartazes: number; protocolos: number } } = {};
  
  // Available years 2017 to 2026
  for (let y = 2017; y <= 2026; y++) {
    yearMap[String(y)] = { ano: String(y), cartazes: 0, protocolos: 0 };
  }

  records.forEach((r) => {
    const y = r.ano || (r.data ? r.data.split('-')[0] : '');
    if (y && yearMap[y]) {
      yearMap[y].cartazes += (r.quantidade || 0);
      yearMap[y].protocolos += 1;
    }
  });

  return Object.values(yearMap);
};

export const getTopClients = (records: PostagemRecord[], selectedYear = 'all', limit = 10) => {
  const filtered = selectedYear === 'all' 
    ? records 
    : records.filter((r) => r.ano === selectedYear);

  const map: { [client: string]: { cliente: string; cartazes: number; protocolos: number } } = {};

  filtered.forEach((r) => {
    const client = (r.cliente || 'Outros').trim().toUpperCase();
    if (!client || client === 'NONE' || client === '?') return;
    if (!map[client]) {
      map[client] = { cliente: client, cartazes: 0, protocolos: 0 };
    }
    map[client].cartazes += (r.quantidade || 0);
    map[client].protocolos += 1;
  });

  return Object.values(map)
    .sort((a, b) => b.cartazes - a.cartazes)
    .slice(0, limit);
};

export const getGraficasDistribution = (records: PostagemRecord[], selectedYear = 'all') => {
  const filtered = selectedYear === 'all' 
    ? records 
    : records.filter((r) => r.ano === selectedYear);

  const map: { [grafica: string]: { name: string; value: number; protocolos: number } } = {};

  filtered.forEach((r) => {
    let g = (r.grafica || 'NÃO INFORMADA').trim().toUpperCase();
    // Normalize aliases
    if (g.includes('ZOOM')) g = 'ZOOM IMAGEM';
    else if (g.includes('MPV') || g.includes('MPV7')) g = 'MPV7';
    else if (g.includes('IDENT')) g = 'IDENTFIX';
    else if (g.includes('NEOBAND')) g = 'NEOBAND';
    else if (g.includes('M2')) g = 'M2';
    else if (g.includes('SEVEN')) g = 'SEVEN';
    else if (g.includes('P+E')) g = 'P+E';
    else if (g.includes('MAVIMIX')) g = 'MAVIMIX';
    else if (g.includes('DANF') || g.includes('DANFE')) g = 'DANFE';

    if (!map[g]) {
      map[g] = { name: g, value: 0, protocolos: 0 };
    }
    map[g].value += (r.quantidade || 0);
    map[g].protocolos += 1;
  });

  const sorted = Object.values(map).sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 6);
  const others = sorted.slice(6);
  if (others.length > 0) {
    const othersVal = others.reduce((acc, curr) => acc + curr.value, 0);
    const othersProto = others.reduce((acc, curr) => acc + curr.protocolos, 0);
    top.push({ name: 'OUTRAS GRÁFICAS', value: othersVal, protocolos: othersProto });
  }

  return top;
};

export const getHourlyDistribution = (records: PostagemRecord[], selectedYear = 'all') => {
  const filtered = selectedYear === 'all' 
    ? records 
    : records.filter((r) => r.ano === selectedYear);

  const slots = [
    { faixa: '08h - 10h (Manhã cedo)', count: 0, cartazes: 0 },
    { faixa: '10h - 12h (Fim da manhã)', count: 0, cartazes: 0 },
    { faixa: '12h - 14h (Almoço)', count: 0, cartazes: 0 },
    { faixa: '14h - 16h (Início da tarde)', count: 0, cartazes: 0 },
    { faixa: '16h - 18h (Fim da tarde)', count: 0, cartazes: 0 },
    { faixa: 'Após 18h (Noturno/Extra)', count: 0, cartazes: 0 },
  ];

  filtered.forEach((r) => {
    if (!r.hora) return;
    const hour = parseInt(r.hora.split(':')[0], 10);
    if (isNaN(hour)) return;

    const q = r.quantidade || 0;
    if (hour >= 8 && hour < 10) { slots[0].count++; slots[0].cartazes += q; }
    else if (hour >= 10 && hour < 12) { slots[1].count++; slots[1].cartazes += q; }
    else if (hour >= 12 && hour < 14) { slots[2].count++; slots[2].cartazes += q; }
    else if (hour >= 14 && hour < 16) { slots[3].count++; slots[3].cartazes += q; }
    else if (hour >= 16 && hour < 18) { slots[4].count++; slots[4].cartazes += q; }
    else if (hour >= 18 || hour < 8) { slots[5].count++; slots[5].cartazes += q; }
  });

  return slots;
};
