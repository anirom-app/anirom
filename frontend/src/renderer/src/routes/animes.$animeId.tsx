import { createFileRoute, useNavigate, Outlet, useMatchRoute } from '@tanstack/react-router'
import { useState, useRef, useEffect } from "react";
import { Loader2, Play, Info, Check, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/main";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import logoImg from "../assets/images/anirom-logo.png";
import { useToast } from "@/hooks/use-toast";
import { AnimeDetailsModal } from "@/components/AnimeDetailsModal";
import { ParallaxCard } from "@/components/ParallaxCard";

export const Route = createFileRoute('/animes/$animeId')({
  component: AnimeDetailsPage,
})

function AnimeDetailsPage() {
  const matchRoute = useMatchRoute();
  const isExact = matchRoute({ to: '/animes/$animeId', fuzzy: false });
  
  const { animeId } = Route.useParams();
  const navigate = useNavigate();

  const [activeSeason, setActiveSeason] = useState(1);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { toast } = useToast();
  const { token } = useAuthStore();
  const utils = trpc.useUtils();

  const { data: anime, isLoading: isLoadingAnime } = trpc.getAnimeDetails.useQuery({ animeId });
  const { data: episodes = [], isLoading: isLoadingEpisodes } = trpc.getAnimeEpisodes.useQuery({ animeId, seasonNumber: activeSeason }, { enabled: !!anime });
  
  const { data: savedAnimes = [] } = trpc.getSavedAnimes.useQuery({ token: token || "" }, { enabled: !!token });
  const isSaved = Array.isArray(savedAnimes) ? savedAnimes.some((s: any) => s.animeId === animeId) : false;
  const toggleSaveMutation = trpc.toggleSavedAnime.useMutation();

  const isLoading = isLoadingAnime;

  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [episodes]);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // Se não estivermos na rota exata (ou seja, estamos na rota de episódio), renderiza apenas o filho
  if (!isExact) {
    return <Outlet />;
  }

  const handleToggleSave = () => {
    if (!token) {
      navigate({ to: '/login' });
      return;
    }
    
    toggleSaveMutation.mutate({ animeId, token: token || "" }, {
      onSuccess: () => {
        utils.getSavedAnimes.invalidate();
        toast({
          title: `Anime ${!isSaved ? 'adicionado!' : 'removido!'}`,
          description: `O anime ${anime?.name} foi ${!isSaved ? 'adicionado' : 'removido'} da sua lista.`,
        })
      }
    });
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
        <button className="px-4 py-2 border rounded hover:bg-white/10 transition" onClick={() => navigate({ to: '/' })}>Voltar</button>
      </div>
    );
  }

  const seasonsArray = Array.from({ length: anime.number_of_seasons || 1 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      
      
      <main className="flex-1 md:ml-20 relative min-h-screen overflow-x-hidden">
        
        {/* Full Hero Background */}
        <div 
          className="absolute inset-0 w-full h-[85vh] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(anirom://media/?url=${encodeURIComponent(`https://image.tmdb.org/t/p/original${anime.backdrop_path}`)})` }}
        >
          {/* Gradient overlay specifically tailored for the left side and bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 pt-32 px-12 md:px-24 w-full">
          
          {/* Studio / Brand (Optional text) */}
          <div className="flex items-center gap-1 mb-4 text-sm font-semibold text-muted-foreground">
            <img src={logoImg} alt="logo anirom" className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-white text-xs" />
            <span className={`text-white text-2xl pt-1 font-pirata`}>Anirom</span>
          </div>

          {/* Title */}
          {anime.images?.logos?.length > 0 ? (
            <img 
              src={`anirom://media/?url=${encodeURIComponent(`https://image.tmdb.org/t/p/w500${anime.images.logos[0].file_path}`)}`} 
              alt={anime.name}
              loading="lazy"
              className="w-auto max-w-full md:max-w-xl h-auto max-h-32 md:max-h-48 object-contain drop-shadow-xl mb-6"
            />
          ) : (
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-pirata tracking-wide drop-shadow-xl mb-4 text-white">
              {anime.name}
            </h1>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-muted-foreground mb-6">
            <span>{anime.first_air_date ? anime.first_air_date.substring(0, 4) : "não disponível"}</span>
            <span>{anime.number_of_seasons} Temporadas</span>
            {anime.genres?.slice(0,3).map((genre: any) => (
              <span key={genre.id} className="px-2 py-0.5 rounded-full border border-border bg-white/5">{genre.name}</span>
            ))}
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
              onClick={() => navigate({ to: '/animes/$animeId/$episodeNumber', params: { animeId: String(animeId), episodeNumber: String(episodes.length > 0 ? episodes[0].episode_number : 1) } })}
              disabled={isLoadingEpisodes}
              className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5 fill-black" />
              Play S{activeSeason} E{episodes.length > 0 ? episodes[0].episode_number : '1'}
            </button>
            <button 
              onClick={handleToggleSave}
              disabled={toggleSaveMutation.isPending}
              className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${
                isSaved 
                  ? 'border-primary bg-primary/20 text-primary hover:bg-primary/30' 
                  : 'border-white/20 bg-white/10 hover:bg-white/20'
              }`}
            >
              {toggleSaveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : isSaved ? <Check className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setIsDetailsModalOpen(true)}
              className="w-12 h-12 rounded-full border border-white/20 bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>

          {/* Seasons Tabs */}
          <div className="flex items-center gap-8 border-b border-white/10 mb-6 overflow-x-auto scrollbar-hide -mr-12 md:-mr-24 pr-12 md:pr-24">
            {seasonsArray.map((seasonNum) => {
              const tmdbSeason = anime?.seasons?.find((s: any) => s.season_number === seasonNum);
              const isNew = tmdbSeason?.air_date 
                ? new Date(tmdbSeason.air_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && new Date(tmdbSeason.air_date) <= new Date()
                : false;
              
              const isComingSoon = tmdbSeason?.air_date
                ? new Date(tmdbSeason.air_date) > new Date() && new Date(tmdbSeason.air_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                : false;
              
              return (
                <button
                  key={seasonNum}
                  onClick={() => setActiveSeason(seasonNum)}
                  className={`pb-4 text-lg font-semibold transition-colors relative whitespace-nowrap flex items-center ${
                    activeSeason === seasonNum ? 'text-white' : 'text-muted-foreground hover:text-white/80'
                  }`}
                >
                  Season {seasonNum}
                  {isNew && <span className="ml-2 text-[10px] font-bold text-white uppercase px-1.5 py-0.5 bg-red-400/50 rounded-md border border-red-400">Nova</span>}
                  {isComingSoon && <span className="ml-2 text-[10px] font-bold text-white uppercase px-1.5 py-0.5 bg-blue-500/50 rounded-md border border-blue-500">Em Breve</span>}
                  {activeSeason === seasonNum && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-white rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Episode Carousel */}
          <div className="relative group/carousel -mr-12 md:-mr-24">
            {showLeft && (
              <button 
                onClick={() => scroll('left')}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/80 hover:bg-white text-black p-3 rounded-full shadow-xl transition-all flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div 
              ref={rowRef}
              onScroll={checkScroll}
              className="flex overflow-x-auto gap-4 pb-8 pt-2 scrollbar-hide snap-x pr-12 md:pr-24 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
            {isLoadingEpisodes && anime ? (
              <div className="flex w-full items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              episodes.map((ep: any) => (
                <div 
                  key={ep.id} 
                  onClick={() => navigate({ to: '/animes/$animeId/$episodeNumber', params: { animeId: String(animeId), episodeNumber: String(ep.episode_number) } })}
                  className="relative flex-none w-[282px] h-[190px] cursor-pointer snap-start"
                >
                  <ParallaxCard className="w-full h-full group bg-[#0a0a0a]">
                    <img 
                      src={`anirom://media/?url=${encodeURIComponent(ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : `https://image.tmdb.org/t/p/w500${anime.backdrop_path}`)}`} 
                      alt={ep.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                    />
                    
                    {/* Ambient Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-85 group-hover:opacity-95 transition-opacity duration-300 pointer-events-none" />
                    
                    {/* Hover play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 pointer-events-none z-20">
                      <div className="p-3.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-2xl transition-transform duration-300 group-hover:scale-110">
                        <Play className="w-6 h-6 fill-white text-white translate-x-0.5" />
                      </div>
                    </div>
                    
                    {/* Glassmorphic Info Panel */}
                    <div className="absolute bottom-0 left-0 right-0 p-3.5 pointer-events-none z-20 transition-transform duration-300 group-hover:translate-y-[-2px]">
                      <h3 className="text-white font-bold text-sm md:text-base line-clamp-1 group-hover:text-primary transition-colors tracking-tight shadow-sm">
                        Episódio {ep.episode_number}
                      </h3>
                      <div className="flex items-center gap-1.5 text-zinc-300 text-xs md:text-sm font-medium mt-0.5 line-clamp-1 drop-shadow-md">
                        {ep.name}
                      </div>
                    </div>
                  </ParallaxCard>
                </div>
              ))
            )}
            
            {episodes.length === 0 && !isLoadingEpisodes && (
              <p className="text-muted-foreground py-8">Nenhum episódio encontrado para esta temporada.</p>
            )}
            </div>

            {showRight && (
              <button 
                onClick={() => scroll('right')}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 bg-white/80 hover:bg-white text-black p-3 rounded-full shadow-xl transition-all flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
          
        </div>
      </main>

      <AnimeDetailsModal 
        isOpen={isDetailsModalOpen} 
        onOpenChange={setIsDetailsModalOpen} 
        anime={anime} 
      />
    </div>
  );
}
