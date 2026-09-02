import { PostagemRecord } from '../types';
import { dbService } from './db';

export type SyncStatus = 'connected' | 'syncing' | 'offline' | 'error';

export interface NetworkInfo {
  ip: string;
  port: number;
  localUrl: string;
  networkUrl: string;
}

class SyncService {
  private eventSource: EventSource | null = null;
  private status: SyncStatus = 'offline';
  private listeners: Array<(status: SyncStatus) => void> = [];
  private networkInfo: NetworkInfo | null = null;
  private isInitialized = false;
  private reconnectTimeout: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public getNetworkInfo(): NetworkInfo | null {
    return this.networkInfo;
  }

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.status);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private setStatus(newStatus: SyncStatus) {
    this.status = newStatus;
    this.listeners.forEach((l) => l(newStatus));
  }

  public async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    await this.fetchNetworkInfo();
    await this.pullAndSyncWithServer();
    this.connectSSE();
  }

  public async fetchNetworkInfo(): Promise<NetworkInfo | null> {
    try {
      const res = await fetch('/api/network-info', { method: 'GET' });
      if (res.ok) {
        this.networkInfo = await res.json();
        return this.networkInfo;
      }
    } catch (e) {
      console.warn('Não foi possível obter informações de rede local:', e);
    }
    return null;
  }

  /**
   * Conecta ao canal de Server-Sent Events para escutar atualizações de outros celulares/PCs em tempo real
   */
  private connectSSE() {
    if (typeof window === 'undefined' || !window.EventSource) return;

    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource('/api/events');

      this.eventSource.addEventListener('connected', () => {
        this.setStatus('connected');
      });

      this.eventSource.addEventListener('record_saved', async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.record) {
            console.log('⚡ [SyncService] Novo registro recebido em tempo real:', data.record.protocolo_os_nf || data.record.id);
            await dbService.internalUpsertRecord(data.record);
          }
        } catch (err) {
          console.warn('Erro ao processar evento record_saved:', err);
        }
      });

      this.eventSource.addEventListener('bulk_saved', async () => {
        console.log('⚡ [SyncService] Sincronização em massa detectada, atualizando...');
        await this.pullAndSyncWithServer();
      });

      this.eventSource.addEventListener('record_deleted', async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.id) {
            await dbService.internalDeleteRecord(data.id);
          }
        } catch (err) {
          console.warn('Erro ao processar record_deleted:', err);
        }
      });

      this.eventSource.onerror = () => {
        this.setStatus('offline');
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        // Tenta reconectar em 5 segundos
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
          this.connectSSE();
        }, 5000);
      };
    } catch (e) {
      this.setStatus('offline');
    }
  }

  private handleOnline() {
    console.log('🌐 Conexão de rede restabelecida. Sincronizando com a central...');
    this.pullAndSyncWithServer();
    this.connectSSE();
  }

  private handleOffline() {
    this.setStatus('offline');
  }

  /**
   * Baixa os registros da central e mescla no IndexedDB do navegador
   */
  public async pullAndSyncWithServer(): Promise<{ syncedCount: number; totalCount: number }> {
    try {
      this.setStatus('syncing');
      const res = await fetch('/api/records', { method: 'GET' });
      if (!res.ok) {
        throw new Error(`Servidor respondeu com status ${res.status}`);
      }

      const serverRecords: PostagemRecord[] = await res.json();
      if (Array.isArray(serverRecords) && serverRecords.length > 0) {
        await dbService.bulkMergeFromServer(serverRecords);
        this.setStatus('connected');
        return { syncedCount: serverRecords.length, totalCount: serverRecords.length };
      }

      this.setStatus('connected');
      return { syncedCount: 0, totalCount: 0 };
    } catch (err) {
      console.warn('Não foi possível sincronizar com o servidor central:', err);
      this.setStatus('offline');
      return { syncedCount: 0, totalCount: 0 };
    }
  }

  /**
   * Envia um registro recém-criado ou editado para o servidor central
   */
  public async pushRecordToServer(record: PostagemRecord): Promise<boolean> {
    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });

      if (res.ok) {
        this.setStatus('connected');
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Erro ao enviar registro para a central (salvo localmente):', err);
      this.setStatus('offline');
      return false;
    }
  }

  /**
   * Notifica a exclusão de um registro para a central
   */
  public async deleteRecordFromServer(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  /**
   * Sobe todos os registros locais para a central (útil se o celular gravou offline e reconectou)
   */
  public async pushAllLocalToServer(): Promise<number> {
    try {
      const localRecords = await dbService.getAllRecords();
      const res = await fetch('/api/records/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: localRecords })
      });

      if (res.ok) {
        const data = await res.json();
        return data.count || localRecords.length;
      }
      return 0;
    } catch (err) {
      console.warn('Erro ao subir registros locais para o servidor:', err);
      return 0;
    }
  }
}

export const syncService = new SyncService();
