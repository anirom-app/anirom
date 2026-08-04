import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Navbar } from "@/components/Navbar";
import { AnimeCard } from "@/components/AnimeCard";
import { Loader2, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { trpc } from '@/main';

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
  const { toast } = useToast();
  
  const utils = trpc.useUtils();
  const { data: savedList = [], isLoading: isLoadingSaved } = trpc.getSavedAnimes.useQuery({ token: token || "" }, { enabled: !!token });
  
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate({ to: "/login" });
      return;
    }

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

  if (isLoadingSaved || isLoadingDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pl-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Navbar />
      
      <main className="flex-1 ml-0 md:ml-20 relative min-h-screen overflow-x-hidden pt-24 px-6 md:px-8 pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-heading font-bold text-white">Meus Animes Salvos</h1>
          
          {savedAnimes.length > 0 && (
            <div className="flex items-center gap-3">
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
                  className="border-white/20 hover:bg-white/10 gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Editar Lista
                </Button>
              )}
            </div>
          )}
        </div>
        
        {savedAnimes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <p className="text-xl text-muted-foreground">Você ainda não salvou nenhum anime.</p>
            <button 
              onClick={() => navigate({ to: "/" })}
              className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
            >
              Explorar Animes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            <AnimatePresence>
              {savedAnimes.map((anime) => {
                const animeIdStr = anime.id.toString();
                const isSelected = selectedIds.includes(animeIdStr);

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
                      <AnimeCard anime={anime} />
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
