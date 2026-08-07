import { useAuthStore } from '../hooks/useAuthStore';

const OFFLINE_HISTORY_QUEUE_KEY = 'anirom_offline_history_queue';

interface HistoryPayload {
  animeId: string;
  episodeNumber: string;
  timestampMillis: number;
  durationMillis: number;
}

class HistorySyncService {
  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    window.addEventListener('online', this.syncOfflineQueue.bind(this));
    
    // Listen to IPC events from Electron
    window.electron.ipcRenderer.on('sync-history', async (_event, payload: HistoryPayload) => {
      await this.pushHistory(payload);
    });
  }

  private async pushHistory(payload: HistoryPayload) {
    const token = useAuthStore.getState().token;
    if (!token) return; // User must be logged in

    try {
      const response = await fetch('http://localhost:9000/api/v1/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync history with backend');
      }
      console.log('[HistorySync] Sincronizado com sucesso', payload);
    } catch (e) {
      console.warn('[HistorySync] Offline ou falha na API. Salvando na fila local...', e);
      this.saveToOfflineQueue(payload);
    }
  }

  private saveToOfflineQueue(payload: HistoryPayload) {
    try {
      const queueStr = localStorage.getItem(OFFLINE_HISTORY_QUEUE_KEY);
      const queue: HistoryPayload[] = queueStr ? JSON.parse(queueStr) : [];
      
      // Filter out older syncs for the same episode to avoid duplicates
      const filteredQueue = queue.filter(
        item => !(item.animeId === payload.animeId && item.episodeNumber === payload.episodeNumber)
      );
      
      filteredQueue.push(payload);
      localStorage.setItem(OFFLINE_HISTORY_QUEUE_KEY, JSON.stringify(filteredQueue));
    } catch (e) {
      console.error('[HistorySync] Falha ao salvar fila offline', e);
    }
  }

  public async syncOfflineQueue() {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const queueStr = localStorage.getItem(OFFLINE_HISTORY_QUEUE_KEY);
      if (!queueStr) return;
      
      const queue: HistoryPayload[] = JSON.parse(queueStr);
      if (queue.length === 0) return;

      console.log(`[HistorySync] Sincronizando ${queue.length} itens da fila offline...`);

      const failedItems: HistoryPayload[] = [];
      
      for (const payload of queue) {
        try {
          const response = await fetch('http://localhost:9000/api/v1/history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
             failedItems.push(payload);
          }
        } catch (e) {
          failedItems.push(payload);
        }
      }

      if (failedItems.length > 0) {
        localStorage.setItem(OFFLINE_HISTORY_QUEUE_KEY, JSON.stringify(failedItems));
      } else {
        localStorage.removeItem(OFFLINE_HISTORY_QUEUE_KEY);
        console.log('[HistorySync] Fila offline esvaziada com sucesso.');
      }
    } catch (e) {
      console.error('[HistorySync] Erro ao processar fila offline', e);
    }
  }
}

export const historySyncService = new HistorySyncService();
