"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuthStore";
import { 
  getTrendingAnimes, 
  getTopRatedAnimes,
  getForYouAnimes,
  getHorrorAnimes,
  getFantasyAnimes,
  getActionAnimes,
  getRandomAnime,
  getAnimeDetails
} from "@/services/tmdb";
import { getAnimeThemeVideo } from "@/services/animethemes";
import { api } from "@/services/api";
import { Navbar } from "@/components/Navbar";
import { AnimeCarousel } from "@/components/AnimeCarousel";
import { Button } from "@/components/ui/button";
import { Bookmark, Loader2, Check } from "lucide-react";
import { toggleSavedAnime, getSavedAnimes } from "@/services/collections";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [trending, setTrending] = useState<any[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);
  const [forYou, setForYou] = useState<any[]>([]);
  const [horror, setHorror] = useState<any[]>([]);
  const [fantasy, setFantasy] = useState<any[]>([]);
  const [actionAnimes, setActionAnimes] = useState<any[]>([]);
  const [heroAnimes, setHeroAnimes] = useState<any[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [videoPhase, setVideoPhase] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSurpriseLoading, setIsSurpriseLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [savedAnimesIds, setSavedAnimesIds] = useState<string[]>([]);
  const [isSavingHero, setIsSavingHero] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [trendingData, topRatedData, forYouData, horrorData, fantasyData, actionData] = await Promise.all([
          getTrendingAnimes(),
          getTopRatedAnimes(),
          getForYouAnimes(),
          getHorrorAnimes(),
          getFantasyAnimes(),
          getActionAnimes()
        ]);
        
        setTrending(trendingData);
        setTopRated(topRatedData);
        setForYou(forYouData);
        setHorror(horrorData);
        setFantasy(fantasyData);
        setActionAnimes(actionData);
        let heroCandidates: any[] = [];
        try {
          const { data: destaques } = await api.get('/banners/destaques');
          if (destaques && destaques.length > 0) {
            const richFeatured = await Promise.all(
              destaques.map((d: any) => getAnimeDetails(d.tmdbId).catch(() => null))
            );
            heroCandidates = richFeatured.filter((a) => a !== null);
          }
        } catch (e) {
          console.error("Erro ao buscar destaques:", e);
        }

        // Preenche as vagas restantes (até 3) com os Mais Bem Avaliados
        if (heroCandidates.length < 3 && topRatedData.length > 0) {
          const needed = 3 - heroCandidates.length;
          const availableTopRated = topRatedData.filter(
            (tr: any) => !heroCandidates.some((hc: any) => hc.id === tr.id)
          );
          const topRatedToFetch = availableTopRated.slice(0, needed);
          const topRatedRich = await Promise.all(
            topRatedToFetch.map((a: any) => getAnimeDetails(a.id).catch(() => a))
          );
          heroCandidates = [...heroCandidates, ...topRatedRich];
        }
        
        if (heroCandidates.length > 0) {
          await Promise.all(heroCandidates.map(async (anime) => {
            try {
              const videoUrl = await getAnimeThemeVideo(anime.name || anime.original_name);
              if (videoUrl) {
                anime.trailerKey = videoUrl; // Aproveitando a propriedade existente
              }
            } catch (e) {}
          }));
          
          setHeroAnimes(heroCandidates);
        }

        try {
          const savedList = await getSavedAnimes();
          setSavedAnimesIds(savedList.map(s => s.animeId));
        } catch (e) {
          console.error("Erro ao carregar animes salvos", e);
        }
      } catch (error) {
        console.error("Erro ao carregar animes", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, router, isHydrated]);

  useEffect(() => {
    if (heroAnimes.length === 0) return;

    let timeout1: NodeJS.Timeout;
    let timeout2: NodeJS.Timeout;
    let timeout3: NodeJS.Timeout;

    setVideoPhase(false);

    const currentAnime = heroAnimes[currentHeroIndex];

    if (currentAnime.trailerKey) {
      // 0-6s: Imagem
      timeout1 = setTimeout(() => {
        setVideoPhase(true); // Entra o vídeo
      }, 6000);

      // 6-11s: Vídeo (5s total)
      timeout2 = setTimeout(() => {
        setVideoPhase(false); // Volta a imagem
      }, 11000);

      // 11-13s: Imagem (2s total)
      timeout3 = setTimeout(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroAnimes.length);
      }, 13000);
    } else {
      // Sem vídeo: apenas aguarda 13s
      timeout3 = setTimeout(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroAnimes.length);
      }, 13000);
    }

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [heroAnimes, currentHeroIndex]);

  const handleSurprise = async () => {
    try {
      setIsSurpriseLoading(true);
      const randomAnime = await getRandomAnime();
      if (randomAnime) {
        router.push(`/animes/${randomAnime.id}`);
      }
    } catch (error) {
      console.error("Erro ao buscar anime surpresa", error);
    } finally {
      setIsSurpriseLoading(false);
    }
  };

  const handleToggleSaveHero = async () => {
    if (!token) return;
    const currentAnime = heroAnimes[currentHeroIndex];
    if (!currentAnime) return;
    
    try {
      setIsSavingHero(true);
      await toggleSavedAnime(currentAnime.id.toString());
      if (savedAnimesIds.includes(currentAnime.id.toString())) {
        setSavedAnimesIds(prev => prev.filter(id => id !== currentAnime.id.toString()));
      } else {
        setSavedAnimesIds(prev => [...prev, currentAnime.id.toString()]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingHero(false);
    }
  };

  if (!isHydrated || !token) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 flex overflow-x-hidden">
      <Navbar />

      <main className="flex-1 min-w-0 overflow-x-hidden md:ml-20 pb-16 md:pb-0 relative min-h-screen">

        {/* Hero Section Carousel */}
        {heroAnimes.length > 0 && (
          <div className="relative w-full min-h-[75vh] md:min-h-[85vh] flex flex-col justify-center py-24 md:py-0 px-6 md:px-16 overflow-hidden">
            {/* Backdrop Backgrounds */}
            {heroAnimes.map((anime, index) => {
              const isActive = index === currentHeroIndex;
              const showVideo = isActive && videoPhase && anime.trailerKey;

              return (
                <div 
                  key={anime.id}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                  <img 
                    src={`https://image.tmdb.org/t/p/original${anime.backdrop_path || anime.poster_path}`}
                    alt={anime.name}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${showVideo ? 'opacity-0' : 'opacity-100'}`}
                  />
                  
                  {anime.trailerKey && isActive && (
                    <video 
                      className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000 ${showVideo ? 'opacity-100' : 'opacity-0'}`} 
                      src={anime.trailerKey} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                    />
                  )}
                  
                  {/* Fade gradient from left to right */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent pointer-events-none z-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none z-10" />
                </div>
              );
            })}

            {/* Hero Content (Aligned Left) */}
            <div className="relative z-10 max-w-3xl space-y-6">
              {heroAnimes[currentHeroIndex].images?.logos?.length > 0 ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w500${heroAnimes[currentHeroIndex].images.logos[0].file_path}`} 
                  alt={heroAnimes[currentHeroIndex].name}
                  className="w-auto max-w-[80%] md:max-w-lg h-auto max-h-24 md:max-h-40 object-contain drop-shadow-2xl transition-all duration-700"
                />
              ) : (
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight font-heading text-white drop-shadow-lg transition-all duration-700">
                  {heroAnimes[currentHeroIndex].name}
                </h1>
              )}
              <p className="text-lg md:text-xl text-gray-300 font-medium line-clamp-3 md:line-clamp-4 max-w-2xl drop-shadow-md transition-all duration-700 delay-100">
                {heroAnimes[currentHeroIndex].overview || "Nenhuma sinopse disponível para este anime no momento."}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Link href={`/animes/${heroAnimes[currentHeroIndex].id}`}>
                  <Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 font-bold px-8 h-12 rounded-full shadow-xl">
                    Mais Detalhes
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={handleToggleSaveHero}
                  disabled={isSavingHero}
                  className={`w-full sm:w-auto gap-2 border-white/20 backdrop-blur-md text-white font-bold px-8 h-12 rounded-full shadow-xl transition-colors ${
                    savedAnimesIds.includes(heroAnimes[currentHeroIndex]?.id?.toString())
                      ? 'bg-primary/20 hover:bg-primary/30 border-primary'
                      : 'bg-black/40 hover:bg-black/60'
                  }`}
                >
                  {isSavingHero ? <Loader2 className="w-5 h-5 animate-spin" /> : savedAnimesIds.includes(heroAnimes[currentHeroIndex]?.id?.toString()) ? <Check className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5" />}
                  {savedAnimesIds.includes(heroAnimes[currentHeroIndex]?.id?.toString()) ? 'Salvo' : 'Salvar'}
                </Button>
              </div>
            </div>

            {/* Carousel Indicators */}
            <div className="absolute bottom-8 left-6 md:left-16 z-20 flex items-center gap-2">
              {heroAnimes.map((_, index) => (
                <button 
                  key={index} 
                  onClick={() => setCurrentHeroIndex(index)}
                  className={`h-2 rounded-full transition-all duration-500 ${index === currentHeroIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Carousels */}
        <div className="w-full space-y-12 pt-2 relative z-20 pb-20">
          <AnimeCarousel title="Para Você" animes={forYou} />
          <AnimeCarousel title="Ação" animes={actionAnimes} />
          <AnimeCarousel title="Mistério" animes={horror} />
          <AnimeCarousel title="Fantasia" animes={fantasy} />
          <AnimeCarousel title="Em Alta" animes={trending} />
          <AnimeCarousel title="Mais Bem Avaliados" animes={topRated} />
          
          {/* Botão Surpreenda-me */}
          <div className="flex justify-center pt-12 pb-8">
            <button 
              onClick={handleSurprise}
              disabled={isSurpriseLoading}
              className="relative inline-flex h-14 w-62 overflow-hidden rounded-full p-[3px] focus:outline-none hover:scale-105 transition-transform shadow-2xl"
            >
              <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#ff0055_0%,#0055ff_50%,#ff0055_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-background px-8 text-lg font-extrabold text-white backdrop-blur-3xl uppercase tracking-wider">
                {isSurpriseLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Surpreenda-me"}
              </span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
