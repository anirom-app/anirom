import { describe, it, expect, vi, beforeEach } from 'vitest';
import { historySyncService } from './HistorySyncService';
import { useAuthStore } from '../hooks/useAuthStore';

describe('HistorySyncService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useAuthStore.setState({ token: 'mock-jwt-token' });
  });

  it('deve sincronizar itens da fila offline com o backend quando online', async () => {
    const offlineQueue = [
      { animeId: 'naruto', episodeNumber: '1', timestampMillis: 5000, durationMillis: 10000 },
    ];
    localStorage.setItem('anirom_offline_history_queue', JSON.stringify(offlineQueue));

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ isCompleted: false }),
    });

    await historySyncService.syncOfflineQueue();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:9000/api/v1/history',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-jwt-token',
        }),
      })
    );

    expect(localStorage.getItem('anirom_offline_history_queue')).toBeNull();
  });

  it('deve reter itens na fila offline em caso de falha na requisição HTTP', async () => {
    const offlineQueue = [
      { animeId: 'bleach', episodeNumber: '2', timestampMillis: 3000, durationMillis: 10000 },
    ];
    localStorage.setItem('anirom_offline_history_queue', JSON.stringify(offlineQueue));

    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network offline'));

    await historySyncService.syncOfflineQueue();

    const remainingQueue = JSON.parse(localStorage.getItem('anirom_offline_history_queue') || '[]');
    expect(remainingQueue).toHaveLength(1);
    expect(remainingQueue[0].animeId).toBe('bleach');
  });
});
