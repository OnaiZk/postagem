import { ConvexHttpClient } from "convex/browser";
import { PostagemRecord } from "../types";

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

  public async saveRecord(record: PostagemRecord): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.mutation("records:create" as any, {
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
      });
      return true;
    } catch (e) {
      console.warn("Erro ao salvar no Convex (salvo localmente):", e);
      return false;
    }
  }

  public async updateRecord(record: PostagemRecord): Promise<boolean> {
    return this.saveRecord(record);
  }

  public async deleteRecord(recordId: string): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.mutation("records:remove" as any, { recordId });
      return true;
    } catch (e) {
      console.warn("Erro ao excluir do Convex:", e);
      return false;
    }
  }

  public async clearAllRecords(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.mutation("records:clearAllRecords" as any, {});
      return true;
    } catch (e) {
      console.warn("Erro ao limpar registros no Convex:", e);
      return false;
    }
  }

  public async fetchAllRecords(): Promise<PostagemRecord[] | null> {
    try {
      if (!this.client) return null;
      const data = (await this.client.query("records:list" as any, {})) as any[];
      if (!Array.isArray(data)) return null;

      return data.map((item) => ({
        id: item.recordId || item._id,
        ano: item.ano,
        cliente: item.cliente,
        campanha: item.campanha,
        grafica: item.grafica,
        layout: item.layout,
        quantidade: item.quantidade,
        quantidade_raw: item.quantidade_raw,
        protocolo_os_nf: item.protocolo_os_nf,
        data: item.data,
        hora: item.hora,
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
      console.warn("Não foi possível carregar do Convex Cloud (usando base local):", e);
      return null;
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
      const chunk = records.slice(i, i + batchSize).map((r) => ({
        recordId: r.id,
        ano: r.ano,
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
        await this.client.mutation("records:batchInsert" as any, { items: chunk });
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

  public async saveStockItem(item: any): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.mutation("stock:createStockItem" as any, {
        stockId: item.id,
        cliente: item.cliente || "",
        campanha: item.campanha || "",
        grafica: item.grafica || "",
        tipo_material: item.tipo_material || "Papel Abrigo (120x175)",
        quantidade_total: Number(item.quantidade_total) || 0,
        quantidade_disponivel: Number(item.quantidade_disponivel) || 0,
        quantidade_postada: Number(item.quantidade_postada) || 0,
        localizacao: item.localizacao || "",
        lote_os: item.lote_os || undefined,
        data_entrada: item.data_entrada || "",
        tecnico_responsavel: item.tecnico_responsavel || "",
        status: item.status || "Disponível",
        observacoes: item.observacoes || undefined,
        fotos_layout: item.fotos_layout || [],
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.warn("Erro ao salvar estoque no Convex:", e);
      return false;
    }
  }

  public async deleteStockItem(stockId: string): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.mutation("stock:removeStockItem" as any, { stockId });
      return true;
    } catch (e) {
      console.warn("Erro ao excluir estoque do Convex:", e);
      return false;
    }
  }

  public async saveStockMovement(mov: any): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.mutation("stock:createMovement" as any, {
        movementId: mov.id,
        stock_id: mov.stock_id,
        campanha: mov.campanha || "",
        cliente: mov.cliente || "",
        tipo: mov.tipo || "Entrada",
        quantidade: Number(mov.quantidade) || 0,
        saldo_anterior: Number(mov.saldo_anterior) || 0,
        saldo_atual: Number(mov.saldo_atual) || 0,
        motivo: mov.motivo || undefined,
        tecnico: mov.tecnico || "",
        data_hora: mov.data_hora || new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.warn("Erro ao salvar movimentação no Convex:", e);
      return false;
    }
  }
}

export const convexService = new ConvexService();

