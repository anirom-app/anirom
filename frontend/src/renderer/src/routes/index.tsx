import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useState } from "react";
import { useAuthStore, isTokenExpired } from "@/hooks/useAuthStore";
import { trpc } from "@/main";
import { Navbar } from "@/components/Navbar";
import { AnimeCarousel } from "@/components/AnimeCarousel";
import { ContinueWatchingRow } from "@/components/ContinueWatchingRow";
import { Button } from "@/components/ui/button";
import { Bookmark, Loader2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();
  const [heroAnimes, setHeroAnimes] = useState<any[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [videoPhase, setVideoPhase] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // TRPC Queries
  const { data: trending = [], isError: isTrendingError, error: trendingError } = trpc.getTrendingAnimes.useQuery(undefined, { enabled: !!token });
  const { data: topRated = [], isLoading: loadingTopRated, isError: isTopRatedError, error: topRatedError } = trpc.getTopRatedAnimes.useQuery(undefined, { enabled: !!token });
  const { data: forYou = [] } = trpc.getForYouAnimes.useQuery(undefined, { enabled: !!token });
  const { data: horror = [] } = trpc.getHorrorAnimes.useQuery(undefined, { enabled: !!token });
  const { data: fantasy = [] } = trpc.getFantasyAnimes.useQuery(undefined, { enabled: !!token });
  const { data: actionAnimes = [] } = trpc.getActionAnimes.useQuery(undefined, { enabled: !!token });
  const { data: destaques = [] } = trpc.getDestaques.useQuery(undefined, { 
    enabled: !!token,
    staleTime: 0, // Nunca faz cache no React Query. Sempre puxa os destaques mais recentes do Admin
    refetchOnMount: true
  });
  
  const { data: savedAnimes = [] } = trpc.getSavedAnimes.useQuery({ token: token || "" }, { enabled: !!token });
  const savedAnimesIds = Array.isArray(savedAnimes) ? savedAnimes.map((s: any) => s.animeId) : [];
  
  const toggleSaveMutation = trpc.toggleSavedAnime.useMutation();
  const utils = trpc.useUtils();

  // Random anime mutation (simulated)
  const [isSurpriseLoading, setIsSurpriseLoading] = useState(false);
  const { refetch: fetchRandomAnime } = trpc.getRandomAnime.useQuery(undefined, { enabled: false });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!token || isTokenExpired(token)) {
      if (token) logout(); // Limpa o token expirado
      navigate({ to: "/login" });
    }
  }, [token, isHydrated, navigate, logout]);

  useEffect(() => {
    if (!token || loadingTopRated) return;

    const setupHero = async () => {
      let heroCandidates: any[] = [];
      
      // Process destaques
      if (destaques && destaques.length > 0) {
        // Fetch details
        heroCandidates = destaques.slice(0, 3);
      }
      
      if (heroCandidates.length < 3 && topRated.length > 0) {
        const needed = 3 - heroCandidates.length;
        const available = topRated.filter((tr: any) => !heroCandidates.some(hc => hc.id === tr.id));
        heroCandidates = [...heroCandidates, ...available.slice(0, needed)];
      }

      if (heroCandidates.length > 0) {
        const detailedCandidates = await Promise.all(heroCandidates.map(async (anime) => {
          try {
            const details = await utils.getAnimeDetails.fetch({ animeId: anime.id.toString() });
            const videoUrl = await utils.getAnimeThemeVideo.fetch({ animeTitle: details.original_name || details.name || anime.name });
            
            return {
              ...details,
              ...anime,
              trailerKey: videoUrl || null
            };
          } catch (e) {
            return anime;
          }
        }));
        setHeroAnimes(detailedCandidates);
      }
    };

    setupHero();
  }, [token, loadingTopRated, destaques, topRated]);

  useEffect(() => {
    if (heroAnimes.length === 0) return;

    let timeout1: NodeJS.Timeout;
    let timeout2: NodeJS.Timeout;
    let timeout3: NodeJS.Timeout;

    setVideoPhase(false);
    const currentAnime = heroAnimes[currentHeroIndex];

    if (currentAnime.trailerKey) {
      timeout1 = setTimeout(() => setVideoPhase(true), 6000);
      timeout2 = setTimeout(() => setVideoPhase(false), 11000);
      timeout3 = setTimeout(() => setCurrentHeroIndex((prev) => (prev + 1) % heroAnimes.length), 13000);
    } else {
      timeout3 = setTimeout(() => setCurrentHeroIndex((prev) => (prev + 1) % heroAnimes.length), 13000);
    }

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [heroAnimes, currentHeroIndex]);

  const handleToggleSaveHero = () => {
    if (!token) return;
    const currentAnime = heroAnimes[currentHeroIndex];
    if (!currentAnime) return;
    
    toggleSaveMutation.mutate({ animeId: currentAnime.id.toString(), token }, {
      onSuccess: () => {
        utils.getSavedAnimes.invalidate();
        const isSaved = savedAnimesIds.includes(currentAnime.id.toString());
        toast({
          title: `Anime ${!isSaved ? 'adicionado!' : 'removido!'}`,
          description: `O anime ${currentAnime.name} foi ${!isSaved ? 'adicionado' : 'removido'} da sua lista.`,
        });
      }
    });
  };

  const handleSurprise = async () => {
    try {
      setIsSurpriseLoading(true);
      const res = await fetchRandomAnime();
      if (res.data) {
        navigate({ to: `/animes/${res.data.id}` });
      }
    } catch (error) {
      console.error("Erro ao buscar anime surpresa", error);
    } finally {
      setIsSurpriseLoading(false);
    }
  };

  if (!isHydrated || !token) return null;

  if (loadingTopRated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isTrendingError || isTopRatedError) {
    if (trendingError) {
      console.error('Trending Error:', trendingError)
      return <div className="text-red-500 font-bold p-10 bg-black h-screen">Trending Error: {trendingError.message}</div>
    }
    if (topRatedError) {
      console.error('TopRated Error:', topRatedError)
      return <div className="text-red-500 font-bold p-10 bg-black h-screen">Top Rated Error: {topRatedError.message}</div>
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 flex overflow-x-hidden">
      <Navbar />
      <main className="flex-1 min-w-0 overflow-x-hidden md:ml-20 pb-16 md:pb-0 relative min-h-screen">
        {heroAnimes.length > 0 && (
          <div className="relative w-full min-h-[75vh] md:min-h-[85vh] flex flex-col justify-center py-24 md:py-0 px-6 md:px-16 overflow-hidden">
            {heroAnimes.map((anime, index) => {
              const isActive = index === currentHeroIndex;
              const showVideo = isActive && videoPhase && anime.trailerKey;

              return (
                <div 
                  key={anime.id}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                  <img 
                    src={`anirom://media/?url=${encodeURIComponent(
                      (anime.backdrop_path || anime.poster_path)?.startsWith('http') 
                        ? (anime.backdrop_path || anime.poster_path) 
                        : `https://image.tmdb.org/t/p/original${anime.backdrop_path || anime.poster_path}`
                    )}`}
                    alt={anime.name}
                    loading="lazy"
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
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent pointer-events-none z-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none z-10" />
                </div>
              );
            })}

            <div className="relative z-10 max-w-3xl space-y-6">
              {heroAnimes[currentHeroIndex]?.images?.logos?.length > 0 ? (
                <img 
                  src={`anirom://media/?url=${encodeURIComponent(`https://image.tmdb.org/t/p/w500${heroAnimes[currentHeroIndex].images.logos[0].file_path}`)}`} 
                  alt={heroAnimes[currentHeroIndex].name}
                  loading="lazy"
                  className="w-auto max-w-[80%] md:max-w-lg h-auto max-h-24 md:max-h-40 object-contain drop-shadow-2xl transition-all duration-700"
                />
              ) : (
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight font-heading text-white drop-shadow-lg transition-all duration-700">
                  {heroAnimes[currentHeroIndex]?.name}
                </h1>
              )}
              <p className="text-lg md:text-xl text-gray-300 font-medium line-clamp-3 md:line-clamp-4 max-w-2xl drop-shadow-md transition-all duration-700 delay-100">
                {heroAnimes[currentHeroIndex]?.overview || "Nenhuma sinopse disponível para este anime no momento."}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Link to={`/animes/${heroAnimes[currentHeroIndex]?.id}`}>
                  <Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 font-bold px-8 h-12 rounded-full shadow-xl">
                    Mais Detalhes
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={handleToggleSaveHero}
                  disabled={toggleSaveMutation.isPending}
                  className={`w-full sm:w-auto gap-2 border-white/20 backdrop-blur-md text-white font-bold px-8 h-12 rounded-full shadow-xl transition-colors ${
                    savedAnimesIds.includes(heroAnimes[currentHeroIndex]?.id?.toString())
                      ? 'bg-primary/20 hover:bg-primary/30 border-primary'
                      : 'bg-black/40 hover:bg-black/60'
                  }`}
                >
                  {toggleSaveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : savedAnimesIds.includes(heroAnimes[currentHeroIndex]?.id?.toString()) ? <Check className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5" />}
                  {savedAnimesIds.includes(heroAnimes[currentHeroIndex]?.id?.toString()) ? 'Salvo' : 'Salvar'}
                </Button>
              </div>
            </div>

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

        <div className="w-full space-y-12 pt-2 relative z-20 pb-20">
          <AnimeCarousel title="Para Você" animes={forYou} />
          <AnimeCarousel title="Ação" animes={actionAnimes} />
          <ContinueWatchingRow />
          <AnimeCarousel title="Mistério" animes={horror} />
          <AnimeCarousel title="Fantasia" animes={fantasy} />
          <AnimeCarousel title="Em Alta" animes={trending} />
          <AnimeCarousel title="Mais Bem Avaliados" animes={topRated} />
          
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
