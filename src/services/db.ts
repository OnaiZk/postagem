import { PostagemRecord, StockItem, StockMovement, MovementType } from '../types';
import initialData from '../data/initialData.json';
import { convexService } from './convexService';

const DB_NAME = 'EletromidiaPostagemDB';
const STORE_NAME = 'records';
const STOCK_STORE = 'stock_items';
const MOVEMENTS_STORE = 'stock_movements';
const DB_VERSION = 2;

// Initial sample stock items if empty
const INITIAL_STOCK_ITEMS: Array<Omit<StockItem, 'id' | 'created_at' | 'updated_at'>> = [
  {
    cliente: 'AMBEV',
    campanha: 'CORONA EXTRA - VERÃO SUNSETS',
    grafica: 'ZOOM IMAGEM',
    tipo_material: 'Papel Abrigo (120x175)',
    quantidade_total: 200,
    quantidade_disponivel: 140,
    quantidade_postada: 60,
    localizacao: 'Galpão A - Prateleira 02',
    lote_os: 'OS-8842',
    data_entrada: new Date().toISOString().split('T')[0],
    tecnico_responsavel: 'Carlos Eduardo (Técnico Galpão)',
    status: 'Disponível',
    observacoes: 'Material conferido. Papel couchê 150g com corte padrão 120x175cm para abrigos SP.',
    fotos_layout: [
      {
        id: 'lay_sample_1',
        foto: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
        nome_motivo: 'Motivo 1 - Garrafa Corona Praia',
        quantidade: 70,
        observacoes: 'Postagem em vias principais',
        data_upload: new Date().toISOString()
      },
      {
        id: 'lay_sample_2',
        foto: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80',
        nome_motivo: 'Motivo 2 - Corona Cero Gelada',
        quantidade: 70,
        observacoes: 'Abrigos próximos a parques',
        data_upload: new Date().toISOString()
      }
    ]
  },
  {
    cliente: 'IFOOD',
    campanha: 'ENTREGA GRÁTIS EM 15 MINUTOS',
    grafica: 'MPV7',
    tipo_material: 'Papel Abrigo (120x175)',
    quantidade_total: 350,
    quantidade_disponivel: 210,
    quantidade_postada: 140,
    localizacao: 'Galpão A - Palete 05',
    lote_os: 'NF-19402',
    data_entrada: new Date().toISOString().split('T')[0],
    tecnico_responsavel: 'Marcos Vinicius',
    status: 'Disponível',
    observacoes: 'Distribuição para Zona Sul e Paulista.',
    fotos_layout: [
      {
        id: 'lay_sample_3',
        foto: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80',
        nome_motivo: 'Layout Principal - Pizza & Burger',
        quantidade: 210,
        observacoes: 'Arte vermelha vibrante',
        data_upload: new Date().toISOString()
      }
    ]
  },
  {
    cliente: 'MERCADO LIVRE',
    campanha: 'CHEGA HOJE FULL',
    grafica: 'IDENTFIX',
    tipo_material: 'Papel Abrigo (120x175)',
    quantidade_total: 100,
    quantidade_disponivel: 8,
    quantidade_postada: 92,
    localizacao: 'Galpão B - Prateleira 01',
    lote_os: 'OS-4482',
    data_entrada: new Date().toISOString().split('T')[0],
    tecnico_responsavel: 'Rafael Lima',
    status: 'Baixo Estoque',
    observacoes: 'Restam apenas 8 cartazes para trocas e manutenções de vandalismo.',
    fotos_layout: [
      {
        id: 'lay_sample_4',
        foto: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
        nome_motivo: 'Layout Amarelo - Mãos e Caixas Full',
        quantidade: 8,
        observacoes: 'Manter reserva de segurança',
        data_upload: new Date().toISOString()
      }
    ]
  },
  {
    cliente: 'SANTANDER',
    campanha: 'CONTA GLOBAL & CARTÃO SX',
    grafica: 'NEOBAND',
    tipo_material: 'Papel Abrigo (120x175)',
    quantidade_total: 150,
    quantidade_disponivel: 0,
    quantidade_postada: 150,
    localizacao: 'Galpão B - Palete 11',
    lote_os: 'OS-7719',
    data_entrada: new Date().toISOString().split('T')[0],
    tecnico_responsavel: 'Carlos Eduardo',
    status: 'Esgotado',
    observacoes: 'Campanha 100% postada nos abrigos de ônibus.',
    fotos_layout: [
      {
        id: 'lay_sample_5',
        foto: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
        nome_motivo: 'Layout Vermelho SX',
        quantidade: 0,
        observacoes: 'Postagem total finalizada',
        data_upload: new Date().toISOString()
      }
    ]
  }
];

class DatabaseService {
  private dbPromise: Promise<IDBDatabase>;
  private listeners: Array<() => void> = [];

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB não suportado neste ambiente'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store: records (Protocolos de Recebimento)
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('ano', 'ano', { unique: false });
          store.createIndex('data', 'data', { unique: false });
          store.createIndex('grafica', 'grafica', { unique: false });
          store.createIndex('cliente', 'cliente', { unique: false });
          store.createIndex('protocolo', 'protocolo_os_nf', { unique: false });
        }

        // Store: stock_items (Estoque de Postagem)
        if (!db.objectStoreNames.contains(STOCK_STORE)) {
          const stockStore = db.createObjectStore(STOCK_STORE, { keyPath: 'id' });
          stockStore.createIndex('cliente', 'cliente', { unique: false });
          stockStore.createIndex('campanha', 'campanha', { unique: false });
          stockStore.createIndex('status', 'status', { unique: false });
          stockStore.createIndex('grafica', 'grafica', { unique: false });
          stockStore.createIndex('localizacao', 'localizacao', { unique: false });
        }

        // Store: stock_movements (Histórico de Movimentação)
        if (!db.objectStoreNames.contains(MOVEMENTS_STORE)) {
          const movStore = db.createObjectStore(MOVEMENTS_STORE, { keyPath: 'id' });
          movStore.createIndex('stock_id', 'stock_id', { unique: false });
          movStore.createIndex('data_hora', 'data_hora', { unique: false });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        try {
          // Check records
          const count = await this.countStore(db, STORE_NAME);
          if (count === 0 && Array.isArray(initialData) && initialData.length > 0) {
            console.log(`Carregando ${initialData.length} registros históricos no banco local...`);
            await this.bulkInsertRecords(db, initialData as PostagemRecord[]);
          } else if (count > 6336) {
            // Se houver mais registros acumulados que o esperado, roda deduplicação para limpar
            setTimeout(() => {
              this.deduplicateRecords().catch(() => {});
            }, 500);
          }

          // Check stock items
          const stockCount = await this.countStore(db, STOCK_STORE);
          if (stockCount === 0) {
            console.log(`Inicializando itens padrão de estoque...`);
            await this.seedInitialStock(db);
          }
        } catch (e) {
          console.warn('Erro ao verificar dados iniciais:', e);
        }
        resolve(db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private countStore(db: IDBDatabase, storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (err) {
        resolve(0);
      }
    });
  }

  private bulkInsertRecords(db: IDBDatabase, records: PostagemRecord[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const rec of records) {
        store.put(rec);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async seedInitialStock(db: IDBDatabase): Promise<void> {
    const now = new Date();
    const items: StockItem[] = INITIAL_STOCK_ITEMS.map((item, idx) => ({
      ...item,
      id: `stock_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }));

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STOCK_STORE, 'readwrite');
      const store = tx.objectStore(STOCK_STORE);
      for (const it of items) {
        store.put(it);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ==========================================
  // RECEBIMENTO / PROTOCOLOS (PostagemRecord)
  // ==========================================

  public async getAllRecords(): Promise<PostagemRecord[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result as PostagemRecord[];
        list.sort((a, b) => {
          const dateCompare = (b.data || '').localeCompare(a.data || '');
          if (dateCompare !== 0) return dateCompare;
          return (b.id || '').localeCompare(a.id || '');
        });
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async getRecordById(id: string): Promise<PostagemRecord | undefined> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  public async addRecord(recordData: Omit<PostagemRecord, 'id' | 'created_at'>): Promise<PostagemRecord> {
    const db = await this.dbPromise;
    const now = new Date();
    const newRecord: PostagemRecord = {
      ...recordData,
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: now.toISOString(),
      ano: recordData.ano || (recordData.data ? recordData.data.split('-')[0] : String(now.getFullYear()))
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(newRecord);
      req.onsuccess = () => {
        this.notify();
        // Sincroniza com o servidor central local (Vite/Node)
        fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecord)
        }).catch(() => {});

        // Sincroniza com o Convex caso ativo
        convexService.saveRecord(newRecord).catch(() => {});
        resolve(newRecord);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async updateRecord(record: PostagemRecord): Promise<PostagemRecord> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => {
        this.notify();
        // Sincroniza com o servidor central local
        fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        }).catch(() => {});

        convexService.updateRecord(record).catch(() => {});
        resolve(record);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async deleteRecord(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => {
        this.notify();
        // Notifica o servidor central da exclusão
        fetch(`/api/records/${id}`, { method: 'DELETE' }).catch(() => {});
        convexService.deleteRecord(id).catch(() => {});
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Atualiza ou insere um registro recebido de outro dispositivo em tempo real sem re-disparar POST
   */
  public async internalUpsertRecord(record: PostagemRecord): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(record);
      tx.oncomplete = () => {
        this.notify();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Exclui um registro localmente após notificação SSE sem re-disparar DELETE
   */
  public async internalDeleteRecord(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => {
        this.notify();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Sincroniza e sobrepõe a base de registros a partir de uma nova planilha,
   * garantindo que registros não fiquem duplicados, mas preservando fotos,
   * canhotos e observações adicionadas pelos usuários pelo app.
   */
  public async replaceRecordsFromSpreadsheet(importedRecords: PostagemRecord[]): Promise<number> {
    const db = await this.dbPromise;

    // 1. Obter registros existentes para preservar anexos/fotos/edições manuais
    const existingRecords = await this.getAllRecords();
    const existingById = new Map<string, PostagemRecord>();
    const existingBySignature = new Map<string, PostagemRecord>();

    const getSignature = (r: Partial<PostagemRecord>) => {
      const ano = (r.ano || '').trim();
      const proto = (r.protocolo_os_nf || '').trim().toLowerCase();
      const cli = (r.cliente || '').trim().toLowerCase();
      const camp = (r.campanha || '').trim().toLowerCase();
      const lay = String(r.layout || 1);
      const data = (r.data || '').trim();
      return `${ano}|${proto}|${cli}|${camp}|${lay}|${data}`;
    };

    for (const ex of existingRecords) {
      if (ex.id) existingById.set(ex.id, ex);
      const sig = getSignature(ex);
      existingBySignature.set(sig, ex);
    }

    // 2. Mesclar registros importados preservando modificações manuais (fotos, conferências, obs)
    const finalRecordsMap = new Map<string, PostagemRecord>();

    for (const incoming of importedRecords) {
      const sig = getSignature(incoming);
      const matchedExisting = (incoming.id ? existingById.get(incoming.id) : null) || existingBySignature.get(sig);

      const merged: PostagemRecord = {
        ...incoming,
        // Se o registro existente tem foto, canhoto ou obs personalizada, preserva
        foto_nf: incoming.foto_nf || matchedExisting?.foto_nf,
        foto_cartaz: incoming.foto_cartaz || matchedExisting?.foto_cartaz,
        conferido_qtd: incoming.conferido_qtd ?? matchedExisting?.conferido_qtd ?? true,
        conferido_avaria: incoming.conferido_avaria ?? matchedExisting?.conferido_avaria ?? true,
        conferido_canhoto: incoming.conferido_canhoto ?? matchedExisting?.conferido_canhoto ?? true,
        status: incoming.status !== 'Conferido' ? incoming.status : (matchedExisting?.status || incoming.status || 'Conferido'),
        observacoes: incoming.observacoes || matchedExisting?.observacoes || ''
      };

      finalRecordsMap.set(merged.id, merged);
    }

    // 3. Preservar registros criados manualmente no app que não estavam na planilha (ex: com fotos de recebimento do dia)
    for (const ex of existingRecords) {
      if (ex.id && !finalRecordsMap.has(ex.id)) {
        const sig = getSignature(ex);
        const matchedInFinal = Array.from(finalRecordsMap.values()).some((f) => getSignature(f) === sig);
        if (!matchedInFinal && (ex.foto_nf || ex.foto_cartaz || ex.id.startsWith('rec_17') || ex.id.startsWith('rec_user_'))) {
          finalRecordsMap.set(ex.id, ex);
        }
      }
    }

    const finalRecordsList = Array.from(finalRecordsMap.values());

    // 4. Salva no IndexedDB substituindo a coleção anterior (evita acúmulo de duplicatas)
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const rec of finalRecordsList) {
        store.put(rec);
      }

      tx.oncomplete = () => {
        this.notify();

        // Envia para a central do Vite para atualizar a base compartilhada
        fetch('/api/records/sync-spreadsheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: finalRecordsList })
        }).catch(() => {});

        resolve(finalRecordsList.length);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Detecta e remove registros duplicados existentes no IndexedDB
   */
  public async deduplicateRecords(): Promise<{ removedCount: number; remainingCount: number }> {
    const db = await this.dbPromise;
    const all = await this.getAllRecords();

    const seenMap = new Map<string, PostagemRecord>();
    const duplicateIds: string[] = [];

    const getSignature = (r: PostagemRecord) => {
      const ano = (r.ano || '').trim();
      const proto = (r.protocolo_os_nf || '').trim().toLowerCase();
      const cli = (r.cliente || '').trim().toLowerCase();
      const camp = (r.campanha || '').trim().toLowerCase();
      const lay = String(r.layout || 1);
      const qtd = String(r.quantidade || 0);
      const data = (r.data || '').trim();
      return `${ano}|${proto}|${cli}|${camp}|${lay}|${qtd}|${data}`;
    };

    for (const rec of all) {
      const sig = getSignature(rec);
      const existing = seenMap.get(sig);
      if (existing) {
        const existingScore = (existing.foto_nf ? 10 : 0) + (existing.foto_cartaz ? 10 : 0) + (existing.observacoes ? 2 : 0) + (existing.id.startsWith('rec_imp_') ? 0 : 5);
        const currentScore = (rec.foto_nf ? 10 : 0) + (rec.foto_cartaz ? 10 : 0) + (rec.observacoes ? 2 : 0) + (rec.id.startsWith('rec_imp_') ? 0 : 5);

        if (currentScore > existingScore) {
          duplicateIds.push(existing.id);
          seenMap.set(sig, rec);
        } else {
          duplicateIds.push(rec.id);
        }
      } else {
        seenMap.set(sig, rec);
      }
    }

    if (duplicateIds.length === 0) {
      return { removedCount: 0, remainingCount: all.length };
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const id of duplicateIds) {
        store.delete(id);
      }
      tx.oncomplete = () => {
        this.notify();
        const remaining = all.length - duplicateIds.length;
        console.log(`🧹 [Deduplicação] Removidos ${duplicateIds.length} registros duplicados. Restantes: ${remaining}`);
        resolve({ removedCount: duplicateIds.length, remainingCount: remaining });
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Mescla registros recebidos da central mantendo o IndexedDB atualizado
   */
  public async bulkMergeFromServer(records: PostagemRecord[]): Promise<number> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const rec of records) {
        if (rec.id) {
          store.put(rec);
        }
      }
      tx.oncomplete = () => {
        this.notify();
        resolve(records.length);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  public async bulkAddRecords(records: PostagemRecord[]): Promise<number> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      let count = 0;
      for (const rec of records) {
        if (!rec.id) {
          rec.id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        }
        store.put(rec);
        count++;
      }
      tx.oncomplete = () => {
        this.notify();
        fetch('/api/records/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records })
        }).catch(() => {});
        resolve(count);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  public async resetToInitialData(): Promise<number> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      for (const rec of initialData as PostagemRecord[]) {
        store.put(rec);
      }
      tx.oncomplete = () => {
        this.notify();
        resolve(initialData.length);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  // ==========================================
  // ESTOQUE DE POSTAGEM (StockItem & Movements)
  // ==========================================

  public async getAllStockItems(): Promise<StockItem[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STOCK_STORE, 'readonly');
      const store = tx.objectStore(STOCK_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result as StockItem[];
        // Sort descending by updated_at or created_at
        list.sort((a, b) => (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || ''));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async getStockItemById(id: string): Promise<StockItem | undefined> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STOCK_STORE, 'readonly');
      const store = tx.objectStore(STOCK_STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  public async addStockItem(itemData: Omit<StockItem, 'id' | 'created_at' | 'updated_at'>): Promise<StockItem> {
    const db = await this.dbPromise;
    const now = new Date();
    const nowIso = now.toISOString();

    // Determine status automatically based on quantity
    let calculatedStatus = itemData.status;
    if (itemData.quantidade_disponivel <= 0) {
      calculatedStatus = 'Esgotado';
    } else if (itemData.quantidade_disponivel < 10) {
      calculatedStatus = 'Baixo Estoque';
    } else if (!calculatedStatus) {
      calculatedStatus = 'Disponível';
    }

    const newItem: StockItem = {
      ...itemData,
      status: calculatedStatus,
      id: `stock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: nowIso,
      updated_at: nowIso
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STOCK_STORE, MOVEMENTS_STORE], 'readwrite');
      const stockStore = tx.objectStore(STOCK_STORE);
      const movStore = tx.objectStore(MOVEMENTS_STORE);

      stockStore.add(newItem);

      // Register initial movement entry
      const initMovement: StockMovement = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        stock_id: newItem.id,
        campanha: newItem.campanha,
        cliente: newItem.cliente,
        tipo: 'Entrada',
        quantidade: newItem.quantidade_disponivel,
        saldo_anterior: 0,
        saldo_atual: newItem.quantidade_disponivel,
        motivo: 'Cadastro inicial de estoque',
        tecnico: newItem.tecnico_responsavel || 'Sistema',
        data_hora: nowIso
      };
      movStore.add(initMovement);

      tx.oncomplete = () => {
        this.notify();
        convexService.saveStockItem(newItem).catch(() => {});
        convexService.saveStockMovement(initMovement).catch(() => {});
        resolve(newItem);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  public async updateStockItem(item: StockItem): Promise<StockItem> {
    const db = await this.dbPromise;
    const now = new Date();
    const nowIso = now.toISOString();

    let calculatedStatus = item.status;
    if (item.quantidade_disponivel <= 0) {
      calculatedStatus = 'Esgotado';
    } else if (item.quantidade_disponivel < 10 && item.status !== 'Reservado') {
      calculatedStatus = 'Baixo Estoque';
    } else if (item.status === 'Esgotado' && item.quantidade_disponivel > 0) {
      calculatedStatus = 'Disponível';
    }

    const updated: StockItem = {
      ...item,
      status: calculatedStatus,
      updated_at: nowIso
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STOCK_STORE, 'readwrite');
      const store = tx.objectStore(STOCK_STORE);
      const req = store.put(updated);
      req.onsuccess = () => {
        this.notify();
        convexService.saveStockItem(updated).catch(() => {});
        resolve(updated);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async deleteStockItem(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STOCK_STORE, MOVEMENTS_STORE], 'readwrite');
      const store = tx.objectStore(STOCK_STORE);
      store.delete(id);
      tx.oncomplete = () => {
        this.notify();
        convexService.deleteStockItem(id).catch(() => {});
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Ajuste rápido de estoque (+ entrada ou - baixa para postagem na rua)
   */
  public async quickAdjustStock(
    id: string,
    delta: number,
    tipo: MovementType,
    tecnico: string,
    motivo?: string
  ): Promise<StockItem> {
    const item = await this.getStockItemById(id);
    if (!item) throw new Error('Item de estoque não encontrado');

    const saldoAnterior = item.quantidade_disponivel;
    let novoSaldo = Math.max(0, saldoAnterior + delta);

    let calculatedStatus = item.status;
    if (novoSaldo <= 0) {
      calculatedStatus = 'Esgotado';
    } else if (novoSaldo < 10 && item.status !== 'Reservado') {
      calculatedStatus = 'Baixo Estoque';
    } else if (item.status === 'Esgotado' && novoSaldo > 0) {
      calculatedStatus = 'Disponível';
    }

    let qtdPostada = item.quantidade_postada || 0;
    if (tipo === 'Saída / Postagem na Rua') {
      qtdPostada += Math.abs(delta);
    }

    const nowIso = new Date().toISOString();
    const updated: StockItem = {
      ...item,
      quantidade_disponivel: novoSaldo,
      quantidade_postada: qtdPostada,
      status: calculatedStatus,
      updated_at: nowIso
    };

    const movement: StockMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      stock_id: item.id,
      campanha: item.campanha,
      cliente: item.cliente,
      tipo,
      quantidade: Math.abs(delta),
      saldo_anterior: saldoAnterior,
      saldo_atual: novoSaldo,
      motivo: motivo || (delta > 0 ? `Entrada de ${delta} cartazes` : `Baixa de ${Math.abs(delta)} cartazes para postagem`),
      tecnico: tecnico || 'Técnico Galpão',
      data_hora: nowIso
    };

    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STOCK_STORE, MOVEMENTS_STORE], 'readwrite');
      const stockStore = tx.objectStore(STOCK_STORE);
      const movStore = tx.objectStore(MOVEMENTS_STORE);

      stockStore.put(updated);
      movStore.add(movement);

      tx.oncomplete = () => {
        this.notify();
        convexService.saveStockItem(updated).catch(() => {});
        convexService.saveStockMovement(movement).catch(() => {});
        resolve(updated);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  public async getAllStockMovements(stockId?: string): Promise<StockMovement[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MOVEMENTS_STORE, 'readonly');
      const store = tx.objectStore(MOVEMENTS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        let list = req.result as StockMovement[];
        if (stockId) {
          list = list.filter((m) => m.stock_id === stockId);
        }
        list.sort((a, b) => (b.data_hora || '').localeCompare(a.data_hora || ''));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async clearAll(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, STOCK_STORE, MOVEMENTS_STORE], 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.objectStore(STOCK_STORE).clear();
      tx.objectStore(MOVEMENTS_STORE).clear();
      tx.oncomplete = () => {
        this.notify();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const dbService = new DatabaseService();
