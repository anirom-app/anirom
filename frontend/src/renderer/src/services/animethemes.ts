import axios from 'axios';

// Base API do AnimeThemes
export const animeThemesApi = axios.create({
  baseURL: 'https://api.animethemes.moe',
  timeout: 5000, // Timeout curto de 5s para evitar travar o frontend se a API cair (Fallback)
});

// Cache manual leve para não bombardear a API com a mesma query
const cache = new Map<string, { url: string | null, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hora

/**
 * Busca um vídeo (.webm) oficial de abertura/encerramento de um anime.
 * Utiliza bloco try/catch e retorna null em qualquer falha (Resiliência).
 */
export const getAnimeThemeVideo = async (animeTitle: string): Promise<string | null> => {
  if (!animeTitle) return null;

  const cacheKey = animeTitle.toLowerCase();
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.url;
  }

  try {
    // Faz a busca na API passando o texto e pedindo a relação de vídeos
    const { data } = await animeThemesApi.get('/anime', {
      params: {
        q: animeTitle,
        include: 'animethemes.animethemeentries.videos',
      }
    });

    if (data && data.anime && data.anime.length > 0) {
      // Pega o primeiro anime da busca
      const anime = data.anime[0];
      
      // Verifica se ele possui temas e vídeos atrelados
      if (anime.animethemes && anime.animethemes.length > 0) {
        for (const theme of anime.animethemes) {
          if (theme.animethemeentries && theme.animethemeentries.length > 0) {
            const entry = theme.animethemeentries[0];
            if (entry.videos && entry.videos.length > 0) {
              const videoUrl = entry.videos[0].link;
              cache.set(cacheKey, { url: videoUrl, timestamp: Date.now() });
              return videoUrl;
            }
          }
        }
      }
    }
    
    // Se a busca não achou nenhum anime ou não achou vídeos para ele
    cache.set(cacheKey, { url: null, timestamp: Date.now() });
    return null;
  } catch (error) {
    console.warn("Falha ao conectar no AnimeThemes. Usando imagem de Fallback.");
    return null; // Fallback: retorna nulo para que a UI mantenha a imagem estática
  }
};
