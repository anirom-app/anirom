import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchTorrentioStreams, fetchTorrentioStreamsImdb } from './torrentio';

vi.mock('axios');
vi.mock('@/hooks/useProxyStore', () => ({
  useProxyStore: {
    getState: () => ({
      isProxyEnabled: false,
      customProxies: '',
    }),
  },
}));

describe('Torrentio Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve buscar streams formatadas corretamente para ID do Kitsu', async () => {
    const mockResponse = {
      data: {
        streams: [
          {
            name: 'Torrentio 1080p',
            title: 'Episode 1 [Subbed]\nSeeds: 45',
            infoHash: 'abcdef1234567890',
          },
        ],
      },
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    const streams = await fetchTorrentioStreams(
      'https://torrentio.strem.fun/manifest.json',
      'Torrentio',
      '123',
      1
    );

    expect(streams).toHaveLength(1);
    expect(streams[0].name).toBe('Torrentio 1080p');
    expect(streams[0].addonName).toBe('Torrentio');
  });

  it('deve formatar o nome do addon para "Torrentio Brazuca" quando a URL contiver brazuca', async () => {
    const mockResponse = {
      data: {
        streams: [
          {
            name: 'Torrentio 720p',
            title: 'Episodio 1 Dublado',
          },
        ],
      },
    };

    vi.mocked(axios.get).mockResolvedValueOnce(mockResponse);

    const streams = await fetchTorrentioStreamsImdb(
      'https://torrentio.brazuca.fun/manifest.json',
      'Torrentio',
      'tt1234567',
      1,
      1
    );

    expect(streams).toHaveLength(1);
    expect(streams[0].name).toBe('Torrentio Brazuca 720p');
    expect(streams[0].addonName).toBe('Torrentio Brazuca');
  });

  it('deve retornar array vazio se a API falhar', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network error'));

    const streams = await fetchTorrentioStreams(
      'https://torrentio.strem.fun/manifest.json',
      'Torrentio',
      '999',
      1
    );

    expect(streams).toEqual([]);
  });
});
