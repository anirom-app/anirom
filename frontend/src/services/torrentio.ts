import axios from 'axios';

export interface TorrentioStream {
  name: string;
  title: string;
  url?: string;
  infoHash?: string;
  fileIdx?: number;
  addonName?: string; 
  addonUrl?: string; 
}

const formatStreamName = (originalName: string, addonUrl: string, addonName: string) => {
  if (!originalName) return originalName;
  const isBrazuca = (addonUrl || '').toLowerCase().includes('brazuca') || (addonName || '').toLowerCase().includes('brazuca');
  return (isBrazuca && originalName.includes('Torrentio')) ? originalName.replace('Torrentio', 'Torrentio Brazuca') : originalName;
};

const formatAddonName = (addonUrl: string, addonName: string) => {
  if (!addonName) return addonName;
  const isBrazuca = (addonUrl || '').toLowerCase().includes('brazuca') || addonName.toLowerCase().includes('brazuca');
  if (isBrazuca && addonName.toLowerCase() === 'torrentio') {
    return 'Torrentio Brazuca';
  }
  return addonName;
};

const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

import { useProxyStore } from "@/hooks/useProxyStore";

const fetchWithRetry = async (url: string, retries = 1): Promise<any> => {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const { isProxyEnabled, customProxies } = useProxyStore.getState();

  const targetUrl = isProxyEnabled ? `/api/addons/proxy?target=${encodeURIComponent(url)}` : url;
  const headers = isProxyEnabled && customProxies ? { 'x-custom-proxies': customProxies } : {};

  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.get(targetUrl, { 
        timeout: isProxyEnabled ? 20000 : 10000, 
        headers 
      });
      cache.set(url, { data, timestamp: Date.now() });
      return data;
    } catch (error: any) {
      if (i === retries - 1) {
        console.warn(`[Torrentio] Falha ao buscar ${url}. Proxy ativado: ${isProxyEnabled}`);
        throw error;
      }
      // If we decide to allow more than 1 retry in the future, wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

export const fetchTorrentioStreams = async (
  addonUrl: string,
  addonName: string,
  kitsuId: string, 
  episodeNumber: number
): Promise<TorrentioStream[]> => {
  try {
    const baseUrl = addonUrl.replace('/manifest.json', '');
    const url = `${baseUrl}/stream/series/kitsu:${kitsuId}:${episodeNumber}.json`;
    
    const data = await fetchWithRetry(url);
    if (!data || !data.streams) return [];

    return data.streams.map((stream: any) => ({
      ...stream,
      name: formatStreamName(stream.name, addonUrl, addonName),
      addonName: formatAddonName(addonUrl, addonName),
      addonUrl
    }));
  } catch (error: any) {
    console.warn(`[Torrentio] Falha ao buscar streams do addon ${addonName}: ${error.message}`);
    return [];
  }
};

export const fetchTorrentioStreamsImdb = async (
  addonUrl: string, 
  addonName: string,
  imdbId: string, 
  seasonNumber: number, 
  episodeNumber: number
): Promise<TorrentioStream[]> => {
  try {
    const baseUrl = addonUrl.replace('/manifest.json', '');
    const url = `${baseUrl}/stream/series/${imdbId}:${seasonNumber}:${episodeNumber}.json`;
    
    const data = await fetchWithRetry(url);
    if (!data || !data.streams) return [];

    return data.streams.map((stream: any) => ({
      ...stream,
      name: formatStreamName(stream.name, addonUrl, addonName),
      addonName: formatAddonName(addonUrl, addonName),
      addonUrl
    }));
  } catch (error: any) {
    console.warn(`[Torrentio] Falha ao buscar streams do addon ${addonName}: ${error.message}`);
    return [];
  }
};
