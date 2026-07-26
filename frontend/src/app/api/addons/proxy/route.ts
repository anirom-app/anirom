import { NextResponse } from 'next/server';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Global cache for proxies to avoid fetching them on every request
let proxyListCache: string[] = [];
let lastProxyFetch = 0;
const PROXY_CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Fetch free proxies from proxyscrape
async function fetchFreeProxies(): Promise<string[]> {
  try {
    const { data } = await axios.get('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all');
    if (data && typeof data === 'string') {
      const proxies = data.split('\r\n').filter(p => p.trim() !== '');
      return proxies.map(p => `http://${p}`);
    }
  } catch (error) {
    console.error("Falha ao buscar proxies gratuitos:", error);
  }
  return [];
}

async function getProxyList(request: Request): Promise<string[]> {
  const customProxiesHeader = request.headers.get('x-custom-proxies');
  const customProxies = customProxiesHeader ? customProxiesHeader.split(',') : (process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',') : []);
  
  if (customProxies.length > 0) {
    return customProxies;
  }

  // Fallback to free proxies if no custom proxies are provided
  if (Date.now() - lastProxyFetch > PROXY_CACHE_TTL || proxyListCache.length === 0) {
    proxyListCache = await fetchFreeProxies();
    lastProxyFetch = Date.now();
  }
  
  return proxyListCache;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('target');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Faltando parâmetro target' }, { status: 400 });
  }

  const proxies = await getProxyList(request);
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
  };

  // If no proxies available, try direct request
  if (proxies.length === 0) {
    try {
      const { data } = await axios.get(targetUrl, { timeout: 15000, headers });
      return NextResponse.json(data);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Falha na requisição direta', details: error.message }, 
        { status: error.response?.status || 500 }
      );
    }
  }

  // Shuffle proxies to randomize (simple rotation)
  const shuffledProxies = [...proxies].sort(() => 0.5 - Math.random());
  const maxAttempts = Math.min(2, shuffledProxies.length);

  for (let i = 0; i < maxAttempts; i++) {
    const proxyUrl = shuffledProxies[i];
    const httpsAgent = new HttpsProxyAgent(proxyUrl);
    
    try {
      console.log(`[Proxy] Tentando ${targetUrl} via ${proxyUrl}`);
      const { data } = await axios.get(targetUrl, { 
        timeout: 10000,
        httpsAgent,
        headers,
        // Also apply to http if needed, though torrentio uses https
        proxy: false // disable axios native proxy to use httpsAgent
      });
      
      console.log(`[Proxy] Sucesso via ${proxyUrl}`);
      return NextResponse.json(data);
      
    } catch (error: any) {
      console.warn(`[Proxy] Falha via ${proxyUrl}: ${error.message}`);
      // If it's the last attempt, return the error
      if (i === maxAttempts - 1) {
        return NextResponse.json(
          { error: 'Todas as tentativas de proxy falharam', details: error.message },
          { status: error.response?.status || 500 }
        );
      }
    }
  }
  
  return NextResponse.json({ error: 'Erro inesperado' }, { status: 500 });
}
