"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuthStore";
import { getSavedAnimes } from "@/services/collections";
import { getAnimeDetails } from "@/services/tmdb";
import { Navbar } from "@/components/Navbar";
import { AnimeCard } from "@/components/AnimeCard";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SalvosPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [savedAnimes, setSavedAnimes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
 
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const loadSavedAnimes = async () => {
      try {
        const savedList = await getSavedAnimes();
        
        // Fetch TMDB details for each saved anime
        const animesDetails = await Promise.all(
          savedList.map(async (saved) => {
            try {
              return await getAnimeDetails(saved.animeId);
            } catch (e) {
              return null;
            }
          })
        );
        
        setSavedAnimes(animesDetails.filter((a) => a !== null));
      } catch (error) {
        console.error("Erro ao carregar animes salvos", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedAnimes();
  }, [token, router]);

  if (isLoading) {
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
        <h1 className="text-3xl  font-heading font-bold mb-8 text-white">Meus Animes Salvos</h1>
        
        {savedAnimes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <p className="text-xl text-muted-foreground">Você ainda não salvou nenhum anime.</p>
            <button 
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
            >
              Explorar Animes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {savedAnimes.map((anime) => (
              <div key={anime.id} className="relative">
                <AnimeCard anime={anime} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
