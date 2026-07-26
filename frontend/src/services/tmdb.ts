import axios from 'axios';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export const tmdbApi = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
    language: 'pt-BR',
    include_adult: false,
    without_keywords: '198385,195669,190333,1936,9762,10046,156381,11802,335559', // hentai, ecchi, nudity, etc
  },
});

const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour TTL for TMDB data

const fetchWithCache = async (url: string, extraParams: any = {}, customTTL: number = CACHE_TTL): Promise<any> => {
  const cacheKey = url + JSON.stringify(extraParams);
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < customTTL) {
    return cached.data;
  }
  
  const { data } = await tmdbApi.get(url, { params: extraParams });
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
};

export const getAnimeDetails = async (tmdbId: string) => {
  return fetchWithCache(`/tv/${tmdbId}`, {
    append_to_response: 'images',
    include_image_language: 'pt,en,ja,null',
  });
};

export const getAnimeEpisodes = async (tmdbId: string, seasonNumber: number) => {
  const data = await fetchWithCache(`/tv/${tmdbId}/season/${seasonNumber}`);
  return data.episodes;
};

export const getAnimeExternalIds = async (tmdbId: string) => {
  return fetchWithCache(`/tv/${tmdbId}/external_ids`);
};

export const getAnimeVideos = async (tmdbId: string) => {
  return fetchWithCache(`/tv/${tmdbId}/videos`);
};

export const getTrendingAnimes = async () => {
  const data = await fetchWithCache('/discover/tv', {
    with_original_language: 'ja',
    with_genres: '16',
    sort_by: 'popularity.desc',
    page: 1,
  }, 86400000); // Cache de 24 horas para os banners
  return data.results;
};

export const getTopRatedAnimes = async () => {
  const data = await fetchWithCache('/discover/tv', {
    with_original_language: 'ja',
    with_genres: '16',
    sort_by: 'vote_average.desc',
    'vote_count.gte': 500,
    page: 1,
  });
  return data.results;
};

export const searchAnimes = async (query: string) => {
  const data = await fetchWithCache('/search/tv', {
    query,
    page: 1,
  });
  
  // Filtra rigorosamente para retornar apenas produções japonesas (ja) que possuam o gênero de animação (16)
  const animes = data.results.filter((item: any) => 
    item.original_language === 'ja' && 
    item.genre_ids && 
    item.genre_ids.includes(16)
  );

  return animes;
};

export const getForYouAnimes = async () => {
  const data = await fetchWithCache('/discover/tv', {
    with_original_language: 'ja',
    with_genres: '16',
    sort_by: 'popularity.desc',
    page: 2, // Variar do Em Alta
  });
  return data.results;
};

export const getHorrorAnimes = async () => {
  const data = await fetchWithCache('/discover/tv', {
    with_original_language: 'ja',
    with_genres: '16,9648', // Animação + Mistério (o mais próximo de Terror/Suspense para Séries no TMDb)
    without_genres: '10762', // Exclui Kids
    sort_by: 'popularity.desc',
    page: 1,
  });
  return data.results;
};

export const getFantasyAnimes = async () => {
  const data = await fetchWithCache('/discover/tv', {
    with_original_language: 'ja',
    with_genres: '16,10765', // Animação + Sci-Fi & Fantasy
    without_genres: '10762', // Exclui Kids para focar em Fantasia madura
    sort_by: 'popularity.desc',
    page: 1,
  });
  return data.results;
};

export const getActionAnimes = async () => {
  const data = await fetchWithCache('/discover/tv', {
    with_original_language: 'ja',
    with_genres: '16,10759', // Animação + Ação & Aventura
    sort_by: 'popularity.desc',
    page: 1,
  });
  return data.results;
};

export const getRandomAnime = async () => {
  // Sortear uma página aleatória entre as 20 mais populares (aprox 400 animes)
  const randomPage = Math.floor(Math.random() * 20) + 1;
  // Bypassar o cache para garantir que sempre sorteie algo novo
  const { data } = await tmdbApi.get('/discover/tv', {
    params: {
      with_original_language: 'ja',
      with_genres: '16',
      sort_by: 'popularity.desc',
      page: randomPage,
    }
  });
  
  if (data.results && data.results.length > 0) {
    const randomIndex = Math.floor(Math.random() * data.results.length);
    return data.results[randomIndex];
  }
  return null;
};
