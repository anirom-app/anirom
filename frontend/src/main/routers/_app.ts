import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

import superjson from 'superjson'
import { getCachedData, setCachedData } from '../db/cacheDb'

// Force dotenv to load from the project root
dotenv.config({ path: path.join(__dirname, '../../.env') })

const t = initTRPC.create()

export const router = t.router
export const publicProcedure = t.procedure

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'
const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY

// Configuração do Axios para os microserviços Java
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

const tmdbClient = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: TMDB_API_KEY,
    language: 'pt-BR',
    include_adult: false,
    without_keywords: '198385,195669,190333,1936,9762,10046,156381,11802,335559', // hentai, ecchi, nudity, etc
  }
})

const videoUrlMemoryCache = new Map<string, string | null>();

export const appRouter = router({
  getTrendingAnimes: publicProcedure.query(async () => {
    const cacheKey = 'tmdb_trending_anime_recent'; // changed key to bypass old cache
    let data = getCachedData(cacheKey);
    if (!data) {
      // Pega animes lançados nos últimos 12 meses ordenados por popularidade (Em Alta)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const dateString = oneYearAgo.toISOString().split('T')[0];

      const res = await tmdbClient.get('/discover/tv', { 
        params: { 
          with_original_language: 'ja', 
          sort_by: 'popularity.desc',
          'first_air_date.gte': dateString,
          with_genres: '16'
        } 
      });
      data = res.data;
      setCachedData(cacheKey, data);
    }
    return data.results;
  }),
  getTopRatedAnimes: publicProcedure.query(async () => {
    const cacheKey = 'tmdb_top_rated_v2';
    let data = getCachedData(cacheKey);
    if (!data) {
      const res = await tmdbClient.get('/discover/tv', { params: { with_original_language: 'ja', with_genres: '16', sort_by: 'vote_average.desc', 'vote_count.gte': 500 } });
      data = res.data;
      setCachedData(cacheKey, data);
    }
    return data.results;
  }),
  getForYouAnimes: publicProcedure.query(async () => {
    const cacheKey = 'tmdb_for_you_v2';
    let data = getCachedData(cacheKey);
    if (!data) {
      const res = await tmdbClient.get('/discover/tv', { params: { with_original_language: 'ja', with_genres: '16', sort_by: 'popularity.desc' } });
      data = res.data;
      setCachedData(cacheKey, data);
    }
    return data.results;
  }),
  getHorrorAnimes: publicProcedure.query(async () => {
    const cacheKey = 'tmdb_horror_v2';
    let data = getCachedData(cacheKey);
    if (!data) {
      const res = await tmdbClient.get('/discover/tv', { params: { with_original_language: 'ja', with_genres: '16,9648', without_genres: '10762' } }); // Animation + Mystery, exclude Kids
      data = res.data;
      setCachedData(cacheKey, data);
    }
    return data.results;
  }),
  getFantasyAnimes: publicProcedure.query(async () => {
    const cacheKey = 'tmdb_fantasy_v2';
    let data = getCachedData(cacheKey);
    if (!data) {
      const res = await tmdbClient.get('/discover/tv', { params: { with_original_language: 'ja', with_genres: '16,10765', without_genres: '10762' } }); // Animation + Sci-Fi & Fantasy, exclude Kids
      data = res.data;
      setCachedData(cacheKey, data);
    }
    return data.results;
  }),
  getActionAnimes: publicProcedure.query(async () => {
    const cacheKey = 'tmdb_action_v2';
    let data = getCachedData(cacheKey);
    if (!data) {
      const res = await tmdbClient.get('/discover/tv', { params: { with_original_language: 'ja', with_genres: '16,10759' } }); // Animation + Action & Adventure
      data = res.data;
      setCachedData(cacheKey, data);
    }
    return data.results;
  }),
  getRandomAnime: publicProcedure.query(async () => {
    const randomPage = Math.floor(Math.random() * 20) + 1;
    // Don't cache random to keep it random, or cache per page
    const res = await tmdbClient.get('/discover/tv', { params: { with_original_language: 'ja', with_genres: '16', sort_by: 'popularity.desc', page: randomPage } });
    return res.data.results[Math.floor(Math.random() * res.data.results.length)];
  }),
  getDestaques: publicProcedure.query(async () => {
    try {
      const res = await apiClient.get('/api/v1/banners/destaques');
      return res.data.map((b: any) => ({
        id: b.tmdbId,
        name: b.titulo
      }));
    } catch (error) {
      console.error((error as any).response?.data || (error as any).message || String(error));
      return [];
    }
  }),
  getAnimeDetails: publicProcedure
    .input(z.object({ animeId: z.string() }))
    .query(async ({ input }) => {
      try {
        const cacheKey = `tmdb_details_v2_${input.animeId}`;
        let data = getCachedData(cacheKey);
        if (!data) {
          const response = await tmdbClient.get(`/tv/${input.animeId}`, { params: { append_to_response: 'images,aggregate_credits', include_image_language: 'pt,en,ja,null' } });
          data = response.data;
          setCachedData(cacheKey, data);
        }
        return data;
      } catch (error) {
        console.error((error as any).response?.data || (error as any).message || String(error));
        throw new Error('Falha ao buscar detalhes do anime');
      }
    }),

  getAnimeEpisodes: publicProcedure
    .input(z.object({ animeId: z.string(), seasonNumber: z.number() }))
    .query(async ({ input }) => {
      try {
        const cacheKey = `tmdb_episodes_${input.animeId}_${input.seasonNumber}`;
        let data = getCachedData(cacheKey);
        if (!data) {
          const res = await tmdbClient.get(`/tv/${input.animeId}/season/${input.seasonNumber}`);
          data = res.data;
          setCachedData(cacheKey, data);
        }
        return data.episodes;
      } catch (error) {
        console.error((error as any).response?.data || (error as any).message || String(error));
        return [];
      }
    }),

  getAnimeExternalIds: publicProcedure
    .input(z.object({ animeId: z.string() }))
    .query(async ({ input }) => {
      try {
        const cacheKey = `tmdb_external_ids_${input.animeId}`;
        let data = getCachedData(cacheKey);
        if (!data) {
          const res = await tmdbClient.get(`/tv/${input.animeId}/external_ids`);
          data = res.data;
          setCachedData(cacheKey, data);
        }
        return data;
      } catch (error) {
        console.error((error as any).response?.data || (error as any).message || String(error));
        return {};
      }
    }),

  searchAnimes: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      try {
        const cacheKey = `tmdb_search_${input.query.toLowerCase()}`;
        let data = getCachedData(cacheKey, 1000 * 60 * 60); // 1 hour for search
        if (!data) {
          const res = await tmdbClient.get('/search/tv', { params: { query: input.query } });
          data = res.data;
          setCachedData(cacheKey, data);
        }
        return data.results.filter((item: any) => 
          item.original_language === 'ja' && 
          item.genre_ids && 
          item.genre_ids.includes(16)
        );
      } catch (error) {
        console.error((error as any).response?.data || (error as any).message || String(error));
        return [];
      }
    }),

  fetchAddonManifest: publicProcedure
    .input(z.object({ target: z.string().url() }))
    .query(async ({ input }) => {
      try {
        const response = await axios.get(input.target);
        return response.data;
      } catch (error) {
        console.error((error as any).response?.data || (error as any).message || String(error));
        throw new Error('Falha ao carregar manifest.json');
      }
    }),



  getAnimeThemeVideo: publicProcedure
    .input(z.object({ animeTitle: z.string() }))
    .query(async ({ input }) => {
      try {
        if (!input.animeTitle) return null;
        const cacheKey = input.animeTitle.toLowerCase();
        
        if (videoUrlMemoryCache.has(cacheKey)) {
          return videoUrlMemoryCache.get(cacheKey);
        }

        const { data } = await axios.get('https://api.animethemes.moe/anime', {
          params: {
            q: input.animeTitle,
            include: 'animethemes.animethemeentries.videos',
          },
          timeout: 5000,
        });

        if (data && data.anime && data.anime.length > 0) {
          const anime = data.anime[0];
          if (anime.animethemes && anime.animethemes.length > 0) {
            for (const theme of anime.animethemes) {
              if (theme.animethemeentries && theme.animethemeentries.length > 0) {
                const entry = theme.animethemeentries[0];
                if (entry.videos && entry.videos.length > 0) {
                  const videoUrl = entry.videos[0].link;
                  videoUrlMemoryCache.set(cacheKey, videoUrl);
                  return videoUrl;
                }
              }
            }
          }
        }

        videoUrlMemoryCache.set(cacheKey, null);
        return null;
      } catch (error) {
        console.warn("Falha ao conectar no AnimeThemes. Usando imagem de Fallback.");
        return null;
      }
    }),

  getSavedAnimes: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const response = await apiClient.get('/api/v1/collections/me', {
          headers: { Authorization: `Bearer ${input.token}` }
        });
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error((error as any).response?.data || (error as any).message || String(error));
        return [];
      }
    }),

  toggleSavedAnime: publicProcedure
    .input(z.object({ animeId: z.string(), token: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const response = await apiClient.post(`/api/v1/collections/me/${input.animeId}`, {}, {
          headers: { Authorization: `Bearer ${input.token}` }
        });
        return response.data;
      } catch (error) {
        console.error((error as any).response?.data || (error as any).message || String(error));
        throw new Error('Falha ao alternar anime salvo');
      }
    }),
})

export type AppRouter = typeof appRouter
