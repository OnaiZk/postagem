import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { PostagemRecord, StockItem, StockMovement } from "../types";
import initialData from "../data/initialData.json";

export const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || "https://little-stingray-828.convex.cloud";
export const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL || "https://little-stingray-828.convex.site";

class ConvexService {
  private client: ConvexHttpClient | null = null;
  private isConnected: boolean = false;

  constructor() {
    try {
      this.client = new ConvexHttpClient(CONVEX_URL);
    } catch (e) {
      console.warn("Não foi possível inicializar o cliente Convex:", e);
    }
  }

  public getClient(): ConvexHttpClient | null {
    return this.client;
  }

  public async checkConnection(): Promise<boolean> {
    try {
      if (!this.client) return false;
      const res = await fetch(`${CONVEX_URL}/api/version`, { method: "GET" }).catch(() => null);
      this.isConnected = res ? res.ok : true;
      return this.isConnected;
    } catch (e) {
      this.isConnected = false;
      return false;
    }
  }

  // ==========================================
  // RECEBIMENTO / PROTOCOLOS (PostagemRecord)
  // ==========================================

  public async fetchAllRecords(ano?: string): Promise<PostagemRecord[]> {
    try {
      if (!this.client) return [];
      const data = await this.client.query(api.records.list, { ano: ano && ano !== "all" ? ano : undefined });
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => ({
        id: item.recordId || item._id,
        ano: item.ano,
        cliente: item.cliente || "",
        campanha: item.campanha || "",
        grafica: item.grafica || "",
        layout: item.layout || 1,
        quantidade: item.quantidade || 0,
        quantidade_raw: item.quantidade_raw || String(item.quantidade || 0),
        protocolo_os_nf: item.protocolo_os_nf || "",
        data: item.data || "",
        hora: item.hora || "",
        foto_nf: item.foto_nf,
        foto_cartaz: item.foto_cartaz,
        status: item.status as any,
        observacoes: item.observacoes,
        conferido_qtd: item.conferido_qtd,
        conferido_avaria: item.conferido_avaria,
        conferido_canhoto: item.conferido_canhoto,
        created_at: item.created_at
      }));
    } catch (e) {
      console.warn("Erro ao buscar registros no Convex Cloud:", e);
      return [];
    }
  }

  public async getRecordById(recordId: string): Promise<PostagemRecord | undefined> {
    try {
      if (!this.client) return undefined;
      const item: any = await this.client.query(api.records.getById, { recordId });
      if (!item) return undefined;
      return {
        id: item.recordId || item._id,
        ano: item.ano,
        cliente: item.cliente || "",
        campanha: item.campanha || "",
        grafica: item.grafica || "",
        layout: item.layout || 1,
        quantidade: item.quantidade || 0,
        quantidade_raw: item.quantidade_raw || String(item.quantidade || 0),
        protocolo_os_nf: item.protocolo_os_nf || "",
        data: item.data || "",
        hora: item.hora || "",
        foto_nf: item.foto_nf,
        foto_cartaz: item.foto_cartaz,
        status: item.status as any,
        observacoes: item.observacoes,
        conferido_qtd: item.conferido_qtd,
        conferido_avaria: item.conferido_avaria,
        conferido_canhoto: item.conferido_canhoto,
        created_at: item.created_at
      };
    } catch (e) {
      return undefined;
    }
  }

  public async saveRecord(record: PostagemRecord): Promise<PostagemRecord> {
    if (!this.client) throw new Error("Cliente Convex não inicializado");
    const payload = {
      recordId: record.id,
      ano: record.ano,
      cliente: record.cliente || "",
      campanha: record.campanha || "",
      grafica: record.grafica || "",
      layout: Number(record.layout) || 1,
      quantidade: Number(record.quantidade) || 0,
      quantidade_raw: record.quantidade_raw || String(record.quantidade || 0),
      protocolo_os_nf: record.protocolo_os_nf || "",
      data: record.data || "",
      hora: record.hora || "",
      foto_nf: record.foto_nf || undefined,
      foto_cartaz: record.foto_cartaz || undefined,
      status: record.status || "Conferido",
      observacoes: record.observacoes || undefined,
      conferido_qtd: record.conferido_qtd,
      conferido_avaria: record.conferido_avaria,
      conferido_canhoto: record.conferido_canhoto,
      created_at: record.created_at || new Date().toISOString()
    };
    await this.client.mutation(api.records.create, payload);
    return record;
  }

  public async updateRecord(record: PostagemRecord): Promise<PostagemRecord> {
    return this.saveRecord(record);
  }

  public async deleteRecord(recordId: string): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.mutation(api.records.remove, { recordId });
      return true;
    } catch (e) {
      console.warn("Erro ao excluir do Convex:", e);
      return false;
    }
  }

  public async clearAllRecords(onProgress?: (deleted: number) => void): Promise<number> {
    if (!this.client) return 0;
    try {
      let totalDeleted = 0;
      while (true) {
        const res: any = await this.client.mutation(api.records.clearBatch, { limit: 500 });
        if (!res || res.deleted === 0) break;
        totalDeleted += res.deleted;
        if (onProgress) onProgress(totalDeleted);
        if (!res.hasMore) break;
      }
      return totalDeleted;
    } catch (e) {
      console.warn("Erro ao limpar registros no Convex:", e);
      return 0;
    }
  }

  public async deduplicateRecords(): Promise<{ deletedCount: number; remainingCount: number }> {
    if (!this.client) return { deletedCount: 0, remainingCount: 0 };
    try {
      return await this.client.mutation(api.records.deduplicateConvexRecords, { limit: 1000 });
    } catch (e) {
      console.warn("Erro ao deduplicar Convex:", e);
      return { deletedCount: 0, remainingCount: 0 };
    }
  }

  public async batchSyncRecords(
    records: PostagemRecord[],
    onProgress?: (synced: number, total: number) => void
  ): Promise<number> {
    if (!this.client) throw new Error("Cliente Convex não disponível");

    const batchSize = 100;
    let totalSynced = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const chunk = records.slice(i, i + batchSize).map((r, idx) => ({
        recordId: r.id || `rec_${Date.now()}_${i + idx}`,
        ano: String(r.ano || "2026"),
        cliente: r.cliente || "",
        campanha: r.campanha || "",
        grafica: r.grafica || "",
        layout: Number(r.layout) || 1,
        quantidade: Number(r.quantidade) || 0,
        quantidade_raw: r.quantidade_raw || String(r.quantidade || 0),
        protocolo_os_nf: r.protocolo_os_nf || "",
        data: r.data || "",
        hora: r.hora || "",
        foto_nf: r.foto_nf || undefined,
        foto_cartaz: r.foto_cartaz || undefined,
        status: r.status || "Conferido",
        observacoes: r.observacoes || undefined,
        conferido_qtd: r.conferido_qtd,
        conferido_avaria: r.conferido_avaria,
        conferido_canhoto: r.conferido_canhoto,
        created_at: r.created_at || new Date().toISOString()
      }));

      try {
        await this.client.mutation(api.records.batchInsert, { items: chunk });
        totalSynced += chunk.length;
        if (onProgress) {
          onProgress(totalSynced, records.length);
        }
      } catch (err) {
        console.warn(`Erro no lote ${i} - ${i + chunk.length}:`, err);
      }
    }

    return totalSynced;
  }

  public async resetToInitialData(): Promise<number> {
    await this.clearAllRecords();
    if (Array.isArray(initialData) && initialData.length > 0) {
      return await this.batchSyncRecords(initialData as PostagemRecord[]);
    }
    return 0;
  }

  // ==========================================
  // ESTOQUE (StockItem & StockMovement)
  // ==========================================

  public async fetchAllStockItems(status?: string): Promise<StockItem[]> {
    try {
      if (!this.client) return [];
      const data = await this.client.query(api.stock.listStockItems, {
        status: status && status !== "all" ? status : undefined
      });
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => ({
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
    } catch (e) {
      console.warn("Erro ao buscar estoque no Convex:", e);
      return [];
    }
  }

  public async saveStockItem(item: Partial<StockItem> & { id?: string }): Promise<StockItem> {
    if (!this.client) throw new Error("Cliente Convex não inicializado");
    const stockId = item.id || `stock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const payload = {
      stockId,
      cliente: item.cliente || "",
      campanha: item.campanha || "",
      grafica: item.grafica || "",
      tipo_material: item.tipo_material || "Papel Abrigo (120x175)",
      quantidade_total: Number(item.quantidade_total) || 0,
      quantidade_disponivel: Number(item.quantidade_disponivel) || 0,
      quantidade_postada: Number(item.quantidade_postada) || 0,
      localizacao: item.localizacao || "",
      lote_os: item.lote_os || undefined,
      data_entrada: item.data_entrada || now.split("T")[0],
      tecnico_responsavel: item.tecnico_responsavel || "",
      status: (item.status || "Disponível") as string,
      observacoes: item.observacoes || undefined,
      fotos_layout: (item.fotos_layout || []).map((f) => ({
        id: f.id,
        foto: f.foto,
        nome_motivo: f.nome_motivo,
        quantidade: f.quantidade,
        observacoes: f.observacoes,
        data_upload: f.data_upload || now
      })),
      created_at: item.created_at || now,
      updated_at: now
    };

    await this.client.mutation(api.stock.createStockItem, payload);
    return {
      ...payload,
      id: stockId,
      status: payload.status as any
    };
  }

  public async deleteStockItem(stockId: string): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.mutation(api.stock.removeStockItem, { stockId });
      return true;
    } catch (e) {
      console.warn("Erro ao excluir estoque do Convex:", e);
      return false;
    }
  }

  public async quickAdjustStock(
    stockId: string,
    delta: number,
    tipo: string,
    motivo: string,
    tecnico: string
  ): Promise<StockItem> {
    if (!this.client) throw new Error("Cliente Convex não inicializado");
    const updated: any = await this.client.mutation(api.stock.quickAdjustStock, {
      stockId,
      delta,
      tipo,
      motivo,
      tecnico
    });

    return {
      id: updated.stockId || updated._id,
      cliente: updated.cliente,
      campanha: updated.campanha,
      grafica: updated.grafica,
      tipo_material: updated.tipo_material,
      quantidade_total: updated.quantidade_total,
      quantidade_disponivel: updated.quantidade_disponivel,
      quantidade_postada: updated.quantidade_postada,
      localizacao: updated.localizacao,
      lote_os: updated.lote_os,
      data_entrada: updated.data_entrada,
      tecnico_responsavel: updated.tecnico_responsavel,
      status: updated.status,
      observacoes: updated.observacoes,
      fotos_layout: updated.fotos_layout || [],
      created_at: updated.created_at,
      updated_at: updated.updated_at
    };
  }

  public async fetchStockMovements(stockId?: string): Promise<StockMovement[]> {
    try {
      if (!this.client) return [];
      const data = await this.client.query(api.stock.listMovements, {
        stock_id: stockId
      });
      if (!Array.isArray(data)) return [];

      return data.map((m: any) => ({
        id: m.movementId || m._id,
        stock_id: m.stock_id,
        campanha: m.campanha,
        cliente: m.cliente,
        tipo: m.tipo as any,
        quantidade: m.quantidade,
        saldo_anterior: m.saldo_anterior,
        saldo_atual: m.saldo_atual,
        motivo: m.motivo,
        tecnico: m.tecnico,
        data_hora: m.data_hora
      }));
    } catch (e) {
      console.warn("Erro ao buscar movimentações:", e);
      return [];
    }
  }
}

export const convexService = new ConvexService();


