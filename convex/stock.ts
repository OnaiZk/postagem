import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listStockItems = query({
  args: {
    status: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("stock_items");
    if (args.status && args.status !== "all") {
      return await ctx.db
        .query("stock_items")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    }
    const all = await q.collect();
    return all.sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
  }
});

export const createStockItem = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stock_items")
      .withIndex("by_stockId", (q) => q.eq("stockId", args.stockId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("stock_items", args);
  }
});

export const removeStockItem = mutation({
  args: { stockId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stock_items")
      .withIndex("by_stockId", (q) => q.eq("stockId", args.stockId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  }
});

export const createMovement = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("stock_movements", args);
  }
});

export const getStockItem = query({
  args: { stockId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stock_items")
      .withIndex("by_stockId", (q) => q.eq("stockId", args.stockId))
      .first();
  }
});

export const quickAdjustStock = mutation({
  args: {
    stockId: v.string(),
    delta: v.number(), // positive for postagem/saída (- saldo), negative for return (+ saldo)
    tipo: v.string(), // "Postagem", "Devolução", "Ajuste", etc.
    motivo: v.optional(v.string()),
    tecnico: v.string()
  },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("stock_items")
      .withIndex("by_stockId", (q) => q.eq("stockId", args.stockId))
      .first();

    if (!item) {
      throw new Error(`Item de estoque #${args.stockId} não encontrado.`);
    }

    const saldoAnterior = item.quantidade_disponivel;
    const absDelta = Math.abs(args.delta);
    let novoDisponivel = item.quantidade_disponivel;
    let novoPostado = item.quantidade_postada || 0;

    if (args.tipo === 'Entrada' || args.tipo === 'Devolução') {
      novoDisponivel = item.quantidade_disponivel + absDelta;
      if (args.tipo === 'Devolução' && novoPostado >= absDelta) {
        novoPostado -= absDelta;
      }
    } else {
      // Saída / Postagem / Baixa
      novoDisponivel = Math.max(0, item.quantidade_disponivel - absDelta);
      novoPostado = novoPostado + absDelta;
    }


    let status = item.status;
    if (novoDisponivel === 0) {
      status = "Esgotado";
    } else if (novoDisponivel <= 10) {
      status = "Baixo Estoque";
    } else {
      status = "Disponível";
    }

    const now = new Date().toISOString();

    await ctx.db.patch(item._id, {
      quantidade_disponivel: novoDisponivel,
      quantidade_postada: novoPostado,
      status,
      updated_at: now
    });

    const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await ctx.db.insert("stock_movements", {
      movementId: movId,
      stock_id: args.stockId,
      campanha: item.campanha,
      cliente: item.cliente,
      tipo: args.tipo,
      quantidade: Math.abs(args.delta),
      saldo_anterior: saldoAnterior,
      saldo_atual: novoDisponivel,
      motivo: args.motivo,
      tecnico: args.tecnico || "Técnico de Campo",
      data_hora: now
    });

    return {
      ...item,
      quantidade_disponivel: novoDisponivel,
      quantidade_postada: novoPostado,
      status,
      updated_at: now
    };
  }
});

export const clearAllStock = mutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("stock_items").collect();
    for (const it of items) {
      await ctx.db.delete(it._id);
    }
    const movs = await ctx.db.query("stock_movements").collect();
    for (const m of movs) {
      await ctx.db.delete(m._id);
    }
    return { itemsDeleted: items.length, movementsDeleted: movs.length };
  }
});

export const listMovements = query({
  args: {
    stock_id: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    if (args.stock_id) {
      return await ctx.db
        .query("stock_movements")
        .withIndex("by_stock_id", (q) => q.eq("stock_id", args.stock_id!))
        .collect();
    }
    const all = await ctx.db.query("stock_movements").collect();
    return all.sort((a, b) => b.data_hora.localeCompare(a.data_hora));
  }
});


