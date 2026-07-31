"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Play, Plus, Info, Check, Bookmark } from "lucide-react";
import { getAnimeDetails, getAnimeEpisodes } from "@/services/tmdb";
import { toggleSavedAnime, getSavedAnimes } from "@/services/collections";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Navbar } from "@/components/Navbar";
import { Great_Vibes } from "next/font/google";
import { useToast } from "@/hooks/use-toast";

const vibes = Great_Vibes({ subsets: ["latin"], weight: ["400"] });

export default function AnimeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tmdbId = params.animeId as string;

  const [anime, setAnime] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const {toast} = useToast();
  const { token } = useAuthStore();

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const details = await getAnimeDetails(tmdbId);
        setAnime(details);
        
        const eps = await getAnimeEpisodes(tmdbId, activeSeason);
        setEpisodes(eps);
        
        if (token) {
          const savedList = await getSavedAnimes();
          setIsSaved(savedList.some(s => s.animeId === tmdbId));
        }
      } catch (error) {
        console.error("Erro ao carregar dados do TMDb:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [tmdbId, activeSeason, token]);

  const handleToggleSave = async () => {
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      setIsSaving(true);
      await toggleSavedAnime(tmdbId);
      setIsSaved(!isSaved);
      toast({
        title: `Anime ${!isSaved ? 'adicionado!' : 'removido!'}`,
        description: `O anime ${anime.name} foi ${!isSaved ? 'adicionado' : 'removido'} da sua lista.`,
      })

    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !anime) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pl-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background flex-col gap-4 pl-20">
        <p className="text-xl text-muted-foreground">Anime não encontrado.</p>
        <button className="px-4 py-2 border rounded hover:bg-white/10 transition" onClick={() => router.push('/')}>Voltar</button>
      </div>
    );
  }

  const seasonsArray = Array.from({ length: anime.number_of_seasons || 1 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Navbar />
      
      <main className="flex-1 ml-20 relative min-h-screen overflow-x-hidden">
        
        {/* Full Hero Background */}
        <div 
          className="absolute inset-0 w-full h-[85vh] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${anime.backdrop_path})` }}
        >
          {/* Gradient overlay specifically tailored for the left side and bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 pt-32 px-12 md:px-24 w-full">
          
          {/* Studio / Brand (Optional text) */}
          <div className="flex items-center gap-1 mb-4 text-sm font-semibold text-muted-foreground">
            <img src="/images/anirom-logo.png" alt="logo anirom" className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-white text-xs" />
            <span className={`text-white text-2xl pt-1 ${vibes.className}`}>Anirom</span>
          </div>

          {/* Title */}
          {anime.images?.logos?.length > 0 ? (
            <img 
              src={`https://image.tmdb.org/t/p/w500${anime.images.logos[0].file_path}`} 
              alt={anime.name}
              className="w-auto max-w-full md:max-w-xl h-auto max-h-32 md:max-h-48 object-contain drop-shadow-xl mb-6"
            />
          ) : (
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-pirata tracking-wide drop-shadow-xl mb-4 text-white">
              {anime.name}
            </h1>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-muted-foreground mb-6">
            <span>{anime.first_air_date ? anime.first_air_date.substring(0, 4) : "2024"}</span>
            <span>{anime.number_of_seasons} Seasons</span>
            <span className="px-2 py-0.5 rounded-full border border-border bg-white/5">Anime</span>
            <span className="flex items-center gap-1 text-yellow-500">
              {'★'.repeat(Math.round(anime.vote_average / 2))}
              <span className="text-muted-foreground ml-1">{anime.vote_average?.toFixed(1)}</span>
            </span>
          </div>

          {/* Overview */}
          <p className="max-w-2xl text-base md:text-lg text-gray-300 leading-relaxed drop-shadow-md mb-8 line-clamp-4">
            {anime.overview || "Nenhuma sinopse disponível para este anime no momento."}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mb-16">
            <button 
              onClick={() => {
                if (episodes && episodes.length > 0) {
                  router.push(`/animes/${tmdbId}/${episodes[0].episode_number}`);
                }
              }}
              disabled={isLoading || episodes.length === 0}
              className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5 fill-black" />
              Play S{activeSeason} E{episodes.length > 0 ? episodes[0].episode_number : '1'}
            </button>
            <button 
              onClick={handleToggleSave}
              disabled={isSaving}
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${
                isSaved 
                  ? 'border-primary bg-primary/20 text-primary hover:bg-primary/30' 
                  : 'border-white/20 bg-white/10 hover:bg-white/20'
              }`}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : isSaved ? <Check className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
            <button className="w-12 h-12 rounded-full border border-white/20 bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Info className="w-5 h-5" />
            </button>
          </div>

          {/* Seasons Tabs */}
          <div className="flex items-center gap-8 border-b border-white/10 mb-6 overflow-x-auto scrollbar-hide -mr-12 md:-mr-24 pr-12 md:pr-24">
            {seasonsArray.map((seasonNum) => (
              <button
                key={seasonNum}
                onClick={() => setActiveSeason(seasonNum)}
                className={`pb-4 text-lg font-semibold transition-colors relative whitespace-nowrap ${
                  activeSeason === seasonNum ? 'text-white' : 'text-muted-foreground hover:text-white/80'
                }`}
              >
                Season {seasonNum}
                {activeSeason === seasonNum && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Episode Carousel */}
          <div className="flex overflow-x-auto gap-4 pb-8 pt-2 scrollbar-hide snap-x -mr-12 md:-mr-24 pr-12 md:pr-24">
            {isLoading && anime ? (
              <div className="flex w-full items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              episodes.map((ep) => (
                <div 
                  key={ep.id} 
                  onClick={() => router.push(`/animes/${tmdbId}/${ep.episode_number}`)}
                  className="relative flex-none w-[280px] h-[160px] rounded-xl overflow-hidden cursor-pointer group snap-start border border-white/10 shadow-lg"
                >
                  <img 
                    src={ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : `https://image.tmdb.org/t/p/w500${anime.backdrop_path}`} 
                    alt={ep.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Bottom Gradient for Episode Text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
                  
                  {/* Hover play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-12 h-12 text-white fill-white/80" />
                  </div>
                  
                  <div className="absolute bottom-0 left-0 w-full p-4">
                    <h3 className="text-white font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      Episode {ep.episode_number}: {ep.name}
                    </h3>
                  </div>
                </div>
              ))
            )}
            
            {episodes.length === 0 && !isLoading && (
              <p className="text-muted-foreground py-8">Nenhum episódio encontrado para esta temporada.</p>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}
