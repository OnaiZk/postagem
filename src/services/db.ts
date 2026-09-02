import { PostagemRecord, StockItem, StockMovement } from '../types';
import { convexService } from './convexService';

class DatabaseService {
  private listeners: Array<() => void> = [];

  constructor() {
    // Convex Cloud is our sole source of truth.
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.warn('Erro em listener do dbService:', e);
      }
    });
  }


  // ==========================================
  // RECEBIMENTO / PROTOCOLOS (PostagemRecord)
  // ==========================================

  public async getAllRecords(ano?: string): Promise<PostagemRecord[]> {
    return await convexService.fetchAllRecords(ano);
  }

  public async getRecordById(id: string): Promise<PostagemRecord | undefined> {
    return await convexService.getRecordById(id);
  }

  public async addRecord(recordData: Omit<PostagemRecord, 'id' | 'created_at'>): Promise<PostagemRecord> {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const newRecord: PostagemRecord = {
      ...recordData,
      id,
      ano: recordData.ano || (recordData.data ? recordData.data.split('-')[0] : String(now.getFullYear())),
      created_at: now.toISOString()
    };
    await convexService.saveRecord(newRecord);
    this.notify();
    return newRecord;
  }

  public async updateRecord(record: PostagemRecord): Promise<PostagemRecord> {
    await convexService.updateRecord(record);
    this.notify();
    return record;
  }

  public async deleteRecord(id: string): Promise<void> {
    await convexService.deleteRecord(id);
    this.notify();
  }

  public async internalUpsertRecord(record: PostagemRecord): Promise<void> {
    await convexService.saveRecord(record);
    this.notify();
  }

  public async internalDeleteRecord(id: string): Promise<void> {
    await convexService.deleteRecord(id);
    this.notify();
  }

  public async replaceRecordsFromSpreadsheet(importedRecords: PostagemRecord[]): Promise<number> {
    await convexService.clearAllRecords();
    const count = await convexService.batchSyncRecords(importedRecords);
    this.notify();
    return count;
  }

  public async deduplicateRecords(): Promise<{ removedCount: number; remainingCount: number }> {
    const res = await convexService.deduplicateRecords();
    this.notify();
    return {
      removedCount: res.deletedCount,
      remainingCount: res.remainingCount
    };
  }

  public async bulkMergeFromServer(records: PostagemRecord[]): Promise<number> {
    return records.length;
  }

  public async bulkAddRecords(records: PostagemRecord[]): Promise<number> {
    const count = await convexService.batchSyncRecords(records);
    this.notify();
    return count;
  }

  public async resetToInitialData(): Promise<number> {
    const count = await convexService.resetToInitialData();
    this.notify();
    return count;
  }

  public async clearAllRecords(): Promise<void> {
    await convexService.clearAllRecords();
    this.notify();
  }

  // ==========================================
  // ESTOQUE (StockItem & StockMovement)
  // ==========================================

  public async getAllStockItems(status?: string): Promise<StockItem[]> {
    return await convexService.fetchAllStockItems(status);
  }

  public async getStockItemById(id: string): Promise<StockItem | undefined> {
    const all = await convexService.fetchAllStockItems();
    return all.find((item) => item.id === id);
  }

  public async addStockItem(itemData: Omit<StockItem, 'id' | 'created_at' | 'updated_at'>): Promise<StockItem> {
    const item = await convexService.saveStockItem(itemData as any);
    this.notify();
    return item;
  }

  public async updateStockItem(item: StockItem): Promise<StockItem> {
    const updated = await convexService.saveStockItem(item);
    this.notify();
    return updated;
  }

  public async deleteStockItem(id: string): Promise<void> {
    await convexService.deleteStockItem(id);
    this.notify();
  }

  public async quickAdjustStock(
    stockId: string,
    delta: number,
    tipo: string = 'Ajuste',
    arg4: string = '',
    arg5: string = ''
  ): Promise<StockItem> {
    const isArg4Tecnico = arg4.toLowerCase().includes('técnico') || arg4.toLowerCase().includes('carlos') || arg4.toLowerCase().includes('marcos') || arg4.toLowerCase().includes('rafael');
    const tecnico = isArg4Tecnico ? arg4 : (arg5 || 'Técnico de Campo');
    const motivo = isArg4Tecnico ? arg5 : (arg4 || `${tipo} de ${Math.abs(delta)} unidades`);
    const updated = await convexService.quickAdjustStock(stockId, delta, tipo, motivo, tecnico);
    this.notify();
    return updated;
  }


  public async getAllStockMovements(stockId?: string): Promise<StockMovement[]> {
    return await convexService.fetchStockMovements(stockId);
  }

  public async clearAll(): Promise<void> {
    await convexService.clearAllRecords();
    this.notify();
  }
}

export const dbService = new DatabaseService();
