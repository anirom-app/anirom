"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Play, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

import { getAnimeExternalIds, getAnimeDetails } from "@/services/tmdb";
import { fetchTorrentioStreams } from "@/services/torrentio";
import { api } from "@/services/api";
import { useAddonStore } from "@/hooks/useAddonStore";

import { AnimeLoadingScreen } from "@/components/AnimeLoadingScreen";

export default function EpisodePlayer() {
  const params = useParams();
  const router = useRouter();
  const tmdbId = params.animeId as string;
  const episodeNumber = parseInt(params.episodeNumber as string, 10);

  const { addons } = useAddonStore();
  const [magnetLink, setMagnetLink] = useState<string | null>(null);
  
  const [availableStreams, setAvailableStreams] = useState<any[]>([]);
  const [selectedAddonFilter, setSelectedAddonFilter] = useState<string>("Todos");
  
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("Iniciando carregamento...");
  const [isPlaying, setIsPlaying] = useState(false);
  const [animeTitle, setAnimeTitle] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const electronRequire = (window as any).require || (window as any).top?.require;
      if (electronRequire) {
        const { ipcRenderer } = electronRequire('electron');
        const handlePlayerClosed = () => {
          console.log("Recebido evento player-closed, desbloqueando UI.");
          setIsPlaying(false);
        };
        ipcRenderer.on('player-closed', handlePlayerClosed);
        return () => {
          ipcRenderer.removeListener('player-closed', handlePlayerClosed);
        };
      }
    }
  }, []);

  // Old interval removed

  useEffect(() => {
    async function loadStream() {
      if (addons.length === 0) {
        setIsLoading(false);
        setStatus("Não foi possível puxar os episódios pois não há nenhum addon conectado.");
        return;
      }

      try {
        setIsLoading(true);

        setStatus("Consultando base do TMDb...");
        const details = await getAnimeDetails(tmdbId);
        if (details && details.name) setAnimeTitle(details.name);
        
        const externalIds = await getAnimeExternalIds(tmdbId);
        const imdbId = externalIds.imdb_id;
        
        if (!imdbId) {
          throw new Error("IMDb ID não encontrado no TMDb para esta obra.");
        }

        setStatus("Resolvendo mapeamento no Kitsu...");
        let kitsuId = null;
        try {
          const { data: mappingData } = await api.get(`/mappings/kitsu?imdbId=${imdbId}&tmdbId=${tmdbId}`);
          kitsuId = mappingData.kitsuId;
        } catch (err: any) {
          console.warn("Mapeamento Kitsu não encontrado, tentando via IMDb direto...");
        }

        setStatus("Buscando fontes...");
        let allStreams: any[] = [];
        
        const fetchPromises = addons.map(async (addon, index) => {
          // Atraso intencional de 300ms entre cada addon para não acionar o Anti-DDoS (Erro 429) do Torrentio/Brazuca
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, index * 300));
          }
          if (kitsuId) {
            return await fetchTorrentioStreams(addon.url, addon.name, kitsuId, episodeNumber);
          } else {
            const { fetchTorrentioStreamsImdb } = await import('@/services/torrentio');
            return await fetchTorrentioStreamsImdb(addon.url, addon.name, imdbId, 1, episodeNumber);
          }
        });

        const results = await Promise.allSettled(fetchPromises);
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            allStreams = [...allStreams, ...result.value];
          }
        });
        
        if (allStreams.length === 0) {
          throw new Error("Nenhuma fonte de vídeo encontrada em nenhum dos addons.");
        }

        setAvailableStreams(allStreams);
        
      } catch (error: any) {
        console.error("Erro ao carregar stream:", error);
        setStatus("Erro: " + (error.message || "Falha desconhecida"));
      } finally {
        setIsLoading(false);
      }
    }
    
    loadStream();
  }, [tmdbId, episodeNumber, addons]);

  const handleSelectStream = (stream: any) => {
    console.log("Stream selecionada:", stream);
    
    let streamUrl = "";

    if (stream.infoHash) {
      const trackers = [
        "udp://tracker.opentrackr.org:1337/announce",
        "udp://open.demonii.com:1337/announce",
        "udp://tracker.openbittorrent.com:80/announce",
        "udp://exodus.desync.com:6969/announce",
        "udp://tracker.torrent.eu.org:451/announce",
        "udp://tracker.nyaa.moe:6969/announce",
        "udp://tracker.moeking.me:6969/announce",
        "udp://p4p.arenabg.com:1337/announce",
        "udp://tracker.internetwarriors.net:1337/announce",
        "udp://tracker.zer0day.to:1337/announce",
        "udp://coppersurfer.tk:6969/announce",
        "udp://tracker.leechers-paradise.org:6969/announce"
      ];
      let magnet = `magnet:?xt=urn:btih:${stream.infoHash}`;
      trackers.forEach(tr => {
        magnet += `&tr=${encodeURIComponent(tr)}`;
      });
      
      streamUrl = `http://localhost:8080/api/stream?magnet=${encodeURIComponent(magnet)}&fileIdx=${stream.fileIdx !== undefined ? stream.fileIdx : ''}`;
    } else if (stream.url) {
      streamUrl = stream.url;
    } else {
      alert("Fonte inválida ou corrompida.");
      return;
    }

    console.log("Tentando abrir URL:", streamUrl);
    
    try {
      if (typeof window !== 'undefined') {
        const electronRequire = (window as any).require || (window as any).top.require;
        if (electronRequire) {
          const { ipcRenderer } = electronRequire('electron');
          console.log("Enviando evento IPC play-video...");
          setIsPlaying(true);
          
          const fullTitle = `${animeTitle || "Anime"} - Episódio ${episodeNumber}`;
          
          ipcRenderer.invoke('play-video', { url: streamUrl, title: fullTitle }).then((result: any) => {
            console.log("Resultado do IPC:", result);
          }).catch((err: any) => {
            console.error("Erro no IPC:", err);
            setIsPlaying(false);
            alert("Erro ao chamar MPV: " + err.message);
          });
        } else {
          console.warn("window.require não encontrado.");
          alert("Player nativo requer o aplicativo Electron.");
        }
      }
    } catch (err: any) {
      console.error("Falha geral ao iniciar IPC", err);
      alert("Erro no IPC: " + err.message);
    }
  };

  const renderLoading = () => (
    <AnimeLoadingScreen statusPhrase={status} />
  );

  const uniqueAddons = ["Todos", ...Array.from(new Set(availableStreams.map(s => s.addonName).filter(Boolean)))];
  const filteredStreams = selectedAddonFilter === "Todos" 
    ? availableStreams 
    : availableStreams.filter(s => s.addonName === selectedAddonFilter);

  const renderStreamSelection = () => (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-12 px-4">
      <div className="max-w-3xl w-full">
        <Button variant="ghost" className="mb-6 -ml-4 hover:bg-secondary/20" onClick={() => router.push(`/animes/${tmdbId}`)}>
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar para o Anime
        </Button>
        <h1 className="text-3xl font-heading font-bold mb-2">Escolha uma Qualidade</h1>
        <p className="text-muted-foreground mb-4">
          Encontramos {availableStreams.length} opções disponíveis para o Episódio {episodeNumber}.
        </p>

        {uniqueAddons.length > 2 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/20">
            {uniqueAddons.map(addon => (
              <Button 
                key={addon as string} 
                variant={selectedAddonFilter === addon ? "default" : "outline"} 
                onClick={() => setSelectedAddonFilter(addon as string)}
                size="sm"
                className="whitespace-nowrap"
              >
                {addon as string}
              </Button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {filteredStreams.map((stream, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 0.5) }}
              key={idx}
              onClick={() => handleSelectStream(stream)}
              className="bg-card border border-border/50 hover:border-primary hover:bg-secondary/10 p-5 rounded-xl cursor-pointer transition-all duration-200 group flex items-center justify-between shadow-sm"
            >
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-primary group-hover:text-primary-foreground transition-colors line-clamp-1">
                    {stream.name || "Fonte Desconhecida"}
                  </h3>
                  {stream.addonName && (
                    <span className="text-[10px] font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                      {stream.addonName}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                  {stream.title}
                </p>
              </div>
              <div className="ml-2 flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Play className="w-5 h-5 ml-1" />
              </div>
            </motion.div>
          ))}
          {filteredStreams.length === 0 && (
            <p className="text-center text-muted-foreground mt-8">Nenhuma fonte encontrada para este filtro.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderPlayingOverlay = () => (
    <div className="flex min-h-screen items-center justify-center bg-background/95 backdrop-blur-md flex-col gap-6 relative overflow-hidden z-50 fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
      <motion.div 
        animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center drop-shadow-[0_0_25px_rgba(var(--primary),0.6)] z-10"
      >
        <Play className="w-10 h-10 text-primary ml-2" />
      </motion.div>
      <div className="z-10 text-center max-w-md px-4">
        <h2 className="text-2xl font-heading font-bold text-primary mb-3">O player está em execução!</h2>
        <p className="text-muted-foreground">
          Assista ao seu episódio na janela do MPV. Feche-a para voltar a ter acesso ao Anirom.
        </p>
      </div>
    </div>
  );

  if (isPlaying) {
    return renderPlayingOverlay();
  }

  if (isLoading) {
    return renderLoading();
  }

  if (addons.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background flex-col gap-4">
        <Plug className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
        <p className="text-xl text-red-500 font-bold max-w-lg text-center px-4">{status}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/settings')}>
          Adicionar Addons
        </Button>
        <Button variant="ghost" onClick={() => router.push(`/animes/${tmdbId}`)}>Voltar</Button>
      </div>
    );
  }

  if (availableStreams.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background flex-col gap-4">
        <p className="text-xl text-red-500 font-bold">{status}</p>
        <Button variant="outline" onClick={() => router.push(`/animes/${tmdbId}`)}>Voltar</Button>
      </div>
    );
  }

  return renderStreamSelection();
}
