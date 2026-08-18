import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Navbar } from "@/components/Navbar";
import { AnimeCard } from "@/components/AnimeCard";
import { Loader2, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { trpc } from '@/main';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

export const Route = createFileRoute('/salvos')({
  component: SalvosPage,
})

function SalvosPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [savedAnimes, setSavedAnimes] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');
  const [sortBy, setSortBy] = useState('recentes');
  const { toast } = useToast();
  
  const utils = trpc.useUtils();
  const { data: savedList = [], isLoading: isLoadingSaved } = trpc.getSavedAnimes.useQuery({ token: token || "" }, { enabled: !!token });
  
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      if (isLoadingSaved) return;
      if (savedList.length === 0) {
        setSavedAnimes([]);
        setIsLoadingDetails(false);
        return;
      }
      try {
        const animesDetails = await Promise.all(
          savedList.map(async (saved: any) => {
            try {
              return await utils.getAnimeDetails.fetch({ animeId: saved.animeId });
            } catch (e) {
              return null;
            }
          })
        );
        setSavedAnimes(animesDetails.filter((a) => a !== null));
      } catch (error) {
        console.error("Erro ao carregar animes salvos", error);
      } finally {
        setIsLoadingDetails(false);
      }
    };
    loadDetails();
  }, [token, savedList, isLoadingSaved, utils, navigate]);

  const toggleSaveMutation = trpc.toggleSavedAnime.useMutation();

  const toggleSelection = (animeId: string) => {
    if (selectedIds.includes(animeId)) {
      setSelectedIds(selectedIds.filter(id => id !== animeId));
    } else {
      setSelectedIds([...selectedIds, animeId]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === savedAnimes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(savedAnimes.map(a => a.id.toString()));
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedIds.length === 0) return;
    
    setIsRemoving(true);
    try {
      await Promise.all(selectedIds.map(id => toggleSaveMutation.mutateAsync({ animeId: id, token: token || "" })));
      
      const removedNames = selectedIds.map(id => {
        const found = savedAnimes.find(a => a.id.toString() === id);
        return found ? (found.name || found.original_name) : "";
      });

      setSavedAnimes(prev => prev.filter(anime => !selectedIds.includes(anime.id.toString())));
      setSelectedIds([]);
      setIsEditing(false);
      utils.getSavedAnimes.invalidate();
      
      toast({
        title: selectedIds.length === 1 ? "Anime removido!" : "Animes removidos!",
        description: selectedIds.length === 1 
          ? `O anime ${removedNames[0]} foi removido da sua lista.` 
          : `${selectedIds.length} animes removidos da sua lista.`,
      });
    } catch (error) {
      console.error("Erro ao remover animes", error);
      toast({
        title: "Erro ao remover",
        description: "Ocorreu um erro ao tentar remover os animes.",
        variant: "destructive"
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
    setSelectedIds([]);
  };

  const getBadgeText = (anime: any) => {
    // 1. Verifica se teve ESTREIA de temporada inteira recentemente
    if (anime.seasons) {
      let isComingSoon = false;
      let hasRecentPremiere = false;

      anime.seasons.forEach((s: any) => {
        if (!s.air_date) return;
        const airDate = new Date(s.air_date);
        const now = new Date();
        const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
        const thirtyDaysFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        if (airDate >= fifteenDaysAgo && airDate <= now) {
          hasRecentPremiere = true;
        } else if (airDate > now && airDate <= thirtyDaysFuture) {
          isComingSoon = true;
        }
      });

      if (hasRecentPremiere) return "Nova Temporada";
      if (isComingSoon) return "Temp. Em Breve"; // Texto encurtado para caber no layout
    }

    // 2. Se a temporada já lançou há mais de 15 dias, mas AINDA lança episódios inéditos
    if (anime.next_episode_to_air) {
      return "Novos Episódios";
    }

    if (anime.last_air_date) {
      const lastAirDate = new Date(anime.last_air_date);
      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      if (lastAirDate >= fifteenDaysAgo) {
        return "Novos Episódios";
      }
    }

    return null;
  };

  const sortedAnimes = useMemo(() => {
    let result = [...savedAnimes];
    
    // 1. Aplicar a aba (Todos ou Novidades)
    if (activeTab === 'novidades') {
      result = result.filter(anime => {
        const badge = getBadgeText(anime);
        return badge === "Nova Temporada" || badge === "Novos Episódios";
      });
    }
    
    // 2. Aplicar ordenação
    result.sort((a, b) => {
      const badgeA = getBadgeText(a);
      const badgeB = getBadgeText(b);

      if (sortBy === 'novidades') {
        const getPriority = (badge: string | null) => {
          if (badge === "Nova Temporada") return 3;
          if (badge === "Novos Episódios") return 2;
          if (badge === "Temp. Em Breve") return 1;
          return 0;
        };
        const pA = getPriority(badgeA);
        const pB = getPriority(badgeB);
        if (pA !== pB) return pB - pA;
      }

      if (sortBy === 'recentes' || sortBy === 'novidades') {
        const indexA = savedList.findIndex(s => s.animeId === a.id.toString());
        const indexB = savedList.findIndex(s => s.animeId === b.id.toString());
        
        const timeA = savedList[indexA]?.savedAt ? new Date(savedList[indexA].savedAt).getTime() : 0;
        const timeB = savedList[indexB]?.savedAt ? new Date(savedList[indexB].savedAt).getTime() : 0;
        
        return timeB - timeA;
      } else if (sortBy === 'az') {
        const nameA = a.name || a.original_name || "";
        const nameB = b.name || b.original_name || "";
        return nameA.localeCompare(nameB);
      } else if (sortBy === 'za') {
        const nameA = a.name || a.original_name || "";
        const nameB = b.name || b.original_name || "";
        return nameB.localeCompare(nameA);
      }
      return 0;
    });

    return result;
  }, [savedAnimes, activeTab, sortBy, savedList]);

  if (isLoadingSaved || isLoadingDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pl-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      
      
      <main className="flex-1 ml-0 md:ml-20 relative min-h-screen overflow-x-hidden pt-24 px-6 md:px-8 pb-20">
        <div className="flex flex-col mb-8 gap-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-heading font-bold text-white">Meus Animes Salvos</h1>
            {savedAnimes.length > 0 && (
              <span className="bg-white/10 text-white/70 px-3 py-1 rounded-full text-sm font-medium">
                {savedAnimes.length} salvos
              </span>
            )}
          </div>

          {/* Área de Ferramentas (Filtros + Edição) */}
          {savedAnimes.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 w-full">
              
              {/* Filtros Tabs e Select na esquerda */}
              {!isEditing && (
                <>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList className="bg-black/50 border border-white/10 p-1 w-full sm:w-auto">
                      <TabsTrigger value="todos" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        Todos
                      </TabsTrigger>
                      <TabsTrigger value="novidades" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        Novidades
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px] bg-black/40 border-white/10">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recentes">Recém Adicionados</SelectItem>
                      <SelectItem value="novidades">Novidades Primeiro</SelectItem>
                      <SelectItem value="az">Ordem Alfabética (A-Z)</SelectItem>
                      <SelectItem value="za">Ordem Alfabética (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Divisor Visual na versão desktop */}
                  <div className="hidden sm:block w-px h-8 bg-white/10 mx-1" />
                </>
              )}

              {/* Botões de Edição */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={selectAll}
                      className="border-white/20 hover:bg-white/10"
                    >
                      {selectedIds.length === savedAnimes.length ? "Desmarcar Todos" : "Selecionar Todos"}
                    </Button>
                    <Button 
                      onClick={handleRemoveSelected}
                      disabled={selectedIds.length === 0 || isRemoving}
                      className="bg-primary hover:bg-primary/80 text-white font-bold gap-2"
                    >
                      {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Remover ({selectedIds.length})
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={toggleEditing}
                      className="text-muted-foreground hover:text-white hover:bg-white/10"
                    >
                      <X className="w-5 h-5 mr-1" />
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={toggleEditing}
                    variant="outline"
                    className="border-white/20 hover:bg-white/10 gap-2 w-full sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Editar Lista
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        
        {sortedAnimes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-4">
            {savedAnimes.length > 0 && activeTab === 'novidades' ? (
              <>
                <p className="text-xl text-muted-foreground font-semibold">Nenhum anime com novidades.</p>
                <p className="text-sm text-white/50 max-w-md">Os animes salvos aparecerão aqui automaticamente quando ganharem novas temporadas ou episódios (lançados nos últimos 15 dias).</p>
                <button 
                  onClick={() => setActiveTab('todos')}
                  className="px-6 py-2 mt-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-colors"
                >
                  Ver Todos os Salvos
                </button>
              </>
            ) : (
              <>
                <p className="text-xl text-muted-foreground">Você ainda não salvou nenhum anime.</p>
                <button 
                  onClick={() => navigate({ to: "/" })}
                  className="px-6 py-3 mt-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                >
                  Explorar Animes
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            <AnimatePresence>
              {sortedAnimes.map((anime) => {
                const animeIdStr = anime.id.toString();
                const isSelected = selectedIds.includes(animeIdStr);
                const badgeText = getBadgeText(anime);

                return (
                  <motion.div 
                    key={anime.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={
                      isEditing 
                        ? { 
                            opacity: 1, 
                            scale: 1, 
                            rotate: [-1, 1, -1],
                            transition: {
                              rotate: {
                                repeat: Infinity,
                                duration: 0.3,
                                ease: "linear"
                              }
                            }
                          } 
                        : { opacity: 1, scale: 1, rotate: 0 }
                    }
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    className="relative"
                    onClick={(e) => {
                      if (isEditing) {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelection(animeIdStr);
                      }
                    }}
                  >
                    <div className={isEditing ? "pointer-events-none" : ""}>
                      <AnimeCard anime={anime} badgeText={badgeText || undefined} />
                    </div>

                    {isEditing && (
                      <div className="absolute inset-0 z-10 flex items-start justify-end p-2 cursor-pointer bg-black/20 rounded-xl hover:bg-black/10 transition-colors">
                        <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${
                          isSelected ? 'bg-primary border-white' : 'bg-black/50 border-white/50'
                        }`}>
                          {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
