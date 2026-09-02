export type UserRole = 'tecnico' | 'lider';

export interface AuthState {
  role: UserRole;
  isLeaderAuthenticated: boolean;
}

export type RecordStatus = 'Conferido' | 'Pendente' | 'Divergência' | 'Avaria';

export interface PostagemRecord {
  id: string;
  ano: string;
  cliente: string;
  campanha: string;
  grafica: string;
  layout: number;
  quantidade: number;
  quantidade_raw?: string;
  protocolo_os_nf: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
  foto_nf?: string; // Base64 or URL
  foto_cartaz?: string; // Base64 or URL
  status: RecordStatus;
  observacoes?: string;
  conferido_qtd?: boolean;
  conferido_avaria?: boolean;
  conferido_canhoto?: boolean;
  created_at: string;
}

export interface FilterState {
  ano: string;
  grafica: string;
  cliente: string;
  status: string;
  search: string;
  dataInicio: string;
  dataFim: string;
}

export interface DashboardKPIs {
  totalRegistros: number;
  totalCartazes: number;
  totalClientes: number;
  totalGraficas: number;
  hojeRegistros: number;
  hojeCartazes: number;
  mesRegistros: number;
  mesCartazes: number;
  taxaConferido: number;
}

// === ESTOQUE DE POSTAGEM & FOTOS DE LAYOUT ===

export type StockStatus = 'Disponível' | 'Baixo Estoque' | 'Esgotado' | 'Reservado';
export type StockMaterialType = 'Papel Abrigo (120x175)' | 'Vinil Adesivo' | 'Lona' | 'Backlight' | 'Painel Digital / Estático' | 'Outro';
export type MovementType = 'Entrada' | 'Saída / Postagem na Rua' | 'Ajuste Manual' | 'Avaria / Descarte';

export interface StockLayoutPhoto {
  id: string;
  foto: string; // Base64 or URL (compressed)
  nome_motivo: string; // Ex: "Motivo 1 - Garrafa", "Layout Principal"
  quantidade?: number; // Qtd específica deste motivo
  observacoes?: string;
  data_upload: string;
}

export interface StockItem {
  id: string;
  cliente: string;
  campanha: string;
  grafica: string;
  tipo_material: StockMaterialType;
  quantidade_total: number;
  quantidade_disponivel: number;
  quantidade_postada: number;
  localizacao: string; // Ex: "Galpão A - Prateleira 3", "Palete 12"
  lote_os?: string; // Número de lote, protocolo ou OS associada
  data_entrada: string; // YYYY-MM-DD
  tecnico_responsavel: string;
  status: StockStatus;
  observacoes?: string;
  fotos_layout: StockLayoutPhoto[];
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  stock_id: string;
  campanha: string;
  cliente: string;
  tipo: MovementType;
  quantidade: number;
  saldo_anterior: number;
  saldo_atual: number;
  motivo?: string;
  tecnico: string;
  data_hora: string;
}

export interface StockKPIs {
  totalPecasEstoque: number;
  totalPecasPostadas: number;
  totalCampanhas: number;
  totalLayoutsFotos: number;
  baixoEstoqueCount: number;
  esgotadoCount: number;
}

