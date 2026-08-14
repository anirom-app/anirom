import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tmdbApi, getAnimeDetails, searchAnimes } from './tmdb';

vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    get: vi.fn(),
  };
  return { default: mockAxios };
});

describe('TMDB Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve buscar e retornar detalhes do anime via tmdbApi', async () => {
    const mockData = {
      id: 12345,
      name: 'Naruto Shippuden',
      overview: 'Um jovem ninja...',
      episodes: []
    };

    vi.spyOn(tmdbApi, 'get').mockResolvedValueOnce({ data: mockData });

    const result = await getAnimeDetails('12345');

    expect(tmdbApi.get).toHaveBeenCalledWith('/tv/12345', {
      params: {
        append_to_response: 'images',
        include_image_language: 'pt,en,ja,null',
      }
    });
    expect(result).toEqual(mockData);
  });

  it('deve filtrar resultados de busca para retornar apenas produções japonesas de animação (ja + gênero 16)', async () => {
    const mockResults = {
      results: [
        { id: 1, name: 'Anime Válido', original_language: 'ja', genre_ids: [16, 10759] },
        { id: 2, name: 'Desenho Americano', original_language: 'en', genre_ids: [16] },
        { id: 3, name: 'Série Live-Action Japonesa', original_language: 'ja', genre_ids: [18] }
      ]
    };

    vi.spyOn(tmdbApi, 'get').mockResolvedValueOnce({ data: mockResults });

    const results = await searchAnimes('Naruto');

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Anime Válido');
  });
});
