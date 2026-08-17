import { describe, it, expect, vi, beforeEach } from 'vitest';
import { historySyncService } from './HistorySyncService';
import { useAuthStore } from '../hooks/useAuthStore';
import { api } from './api';

vi.mock('./api', () => ({
  api: {
    post: vi.fn(),
  },
}));

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

    (api.post as any).mockResolvedValueOnce({
      data: { isCompleted: false },
    });

    await historySyncService.syncOfflineQueue();

    expect(api.post).toHaveBeenCalledWith(
      '/history',
      expect.objectContaining({
        animeId: 'naruto',
        episodeNumber: '1',
      })
    );

    expect(localStorage.getItem('anirom_offline_history_queue')).toBeNull();
  });

  it('deve reter itens na fila offline em caso de falha na requisição HTTP', async () => {
    const offlineQueue = [
      { animeId: 'bleach', episodeNumber: '2', timestampMillis: 3000, durationMillis: 10000 },
    ];
    localStorage.setItem('anirom_offline_history_queue', JSON.stringify(offlineQueue));

    (api.post as any).mockRejectedValueOnce(new Error('Network offline'));

    await historySyncService.syncOfflineQueue();

    const remainingQueue = JSON.parse(localStorage.getItem('anirom_offline_history_queue') || '[]');
    expect(remainingQueue).toHaveLength(1);
    expect(remainingQueue[0].animeId).toBe('bleach');
  });
});
