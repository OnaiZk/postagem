import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  records: defineTable({
    recordId: v.string(), // Client-generated or original ID (e.g. rec_1)
    ano: v.string(),
    cliente: v.string(),
    campanha: v.string(),
    grafica: v.string(),
    layout: v.number(),
    quantidade: v.number(),
    quantidade_raw: v.optional(v.string()),
    protocolo_os_nf: v.string(),
    data: v.string(),
    hora: v.string(),
    foto_nf: v.optional(v.string()),
    foto_cartaz: v.optional(v.string()),
    status: v.string(),
    observacoes: v.optional(v.string()),
    conferido_qtd: v.optional(v.boolean()),
    conferido_avaria: v.optional(v.boolean()),
    conferido_canhoto: v.optional(v.boolean()),
    created_at: v.string()
  })
    .index("by_recordId", ["recordId"])
    .index("by_ano", ["ano"])
    .index("by_data", ["data"])
    .index("by_protocolo", ["protocolo_os_nf"])
    .index("by_cliente", ["cliente"])
    .index("by_grafica", ["grafica"]),

  stock_items: defineTable({
    stockId: v.string(),
    cliente: v.string(),
    campanha: v.string(),
    grafica: v.string(),
    tipo_material: v.string(),
    quantidade_total: v.number(),
    quantidade_disponivel: v.number(),
    quantidade_postada: v.number(),
    localizacao: v.string(),
    lote_os: v.optional(v.string()),
    data_entrada: v.string(),
    tecnico_responsavel: v.string(),
    status: v.string(),
    observacoes: v.optional(v.string()),
    fotos_layout: v.array(
      v.object({
        id: v.string(),
        foto: v.string(),
        nome_motivo: v.string(),
        quantidade: v.optional(v.number()),
        observacoes: v.optional(v.string()),
        data_upload: v.string()
      })
    ),
    created_at: v.string(),
    updated_at: v.string()
  })
    .index("by_stockId", ["stockId"])
    .index("by_cliente", ["cliente"])
    .index("by_campanha", ["campanha"])
    .index("by_status", ["status"]),

  stock_movements: defineTable({
    movementId: v.string(),
    stock_id: v.string(),
    campanha: v.string(),
    cliente: v.string(),
    tipo: v.string(),
    quantidade: v.number(),
    saldo_anterior: v.number(),
    saldo_atual: v.number(),
    motivo: v.optional(v.string()),
    tecnico: v.string(),
    data_hora: v.string()
  })
    .index("by_movementId", ["movementId"])
    .index("by_stock_id", ["stock_id"])
    .index("by_data_hora", ["data_hora"])
});
