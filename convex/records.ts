import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    ano: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("records");
    if (args.ano && args.ano !== "all") {
      const results = await ctx.db
        .query("records")
        .withIndex("by_ano", (q) => q.eq("ano", args.ano!))
        .collect();
      return results;
    }
    const all = await q.collect();
    // Sort descending by data
    return all.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  }
});

export const getByProtocolo = query({
  args: { protocolo: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("records")
      .withIndex("by_protocolo", (q) => q.eq("protocolo_os_nf", args.protocolo))
      .first();
  }
});

export const create = mutation({
  args: {
    recordId: v.string(),
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
  },
  handler: async (ctx, args) => {
    // Check if recordId already exists in convex
    const existing = await ctx.db
      .query("records")
      .withIndex("by_recordId", (q) => q.eq("recordId", args.recordId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    const id = await ctx.db.insert("records", args);
    return id;
  }
});

export const update = mutation({
  args: {
    recordId: v.string(),
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("records")
      .withIndex("by_recordId", (q) => q.eq("recordId", args.recordId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("records", args);
    }
  }
});

export const remove = mutation({
  args: { recordId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("records")
      .withIndex("by_recordId", (q) => q.eq("recordId", args.recordId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  }
});

export const batchInsert = mutation({
  args: {
    items: v.array(
      v.object({
        recordId: v.string(),
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
    )
  },
  handler: async (ctx, args) => {
    let insertedCount = 0;
    for (const item of args.items) {
      const existing = await ctx.db
        .query("records")
        .withIndex("by_recordId", (q) => q.eq("recordId", item.recordId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, item);
      } else {
        await ctx.db.insert("records", item);
      }
      insertedCount++;
    }
    return insertedCount;
  }
});

export const deduplicateConvexRecords = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("records").collect();
    const seenMap = new Map<string, any>();
    let deletedCount = 0;

    for (const rec of all) {
      const sig = `${rec.ano}|${(rec.protocolo_os_nf || '').toLowerCase()}|${(rec.cliente || '').toLowerCase()}|${(rec.campanha || '').toLowerCase()}|${rec.layout}|${rec.quantidade}|${rec.data || ''}`;
      if (seenMap.has(sig)) {
        await ctx.db.delete(rec._id);
        deletedCount++;
      } else {
        seenMap.set(sig, rec);
      }
    }

    return { deletedCount, remainingCount: all.length - deletedCount };
  }
});
