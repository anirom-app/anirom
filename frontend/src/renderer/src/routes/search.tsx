import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Navbar } from "@/components/Navbar";
import { Loader2 } from "lucide-react";
import { AnimeCard } from "@/components/AnimeCard";
import { motion } from "framer-motion";
import { trpc } from '@/main';

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    return {
      q: typeof search.q === 'string' ? search.q : undefined,
    }
  },
  component: SearchPage,
})

function SearchPage() {
  const { q: query = "" } = Route.useSearch();
  const navigate = useNavigate();

  const { data: results = [], isLoading } = trpc.searchAnimes.useQuery({ query }, { enabled: !!query });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Navbar />
      
      <main className="flex-1 ml-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold">
            Resultados para: <span className="text-primary">"{query}"</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            {results.length} animes encontrados
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {results.map((anime: any, idx: number) => (
              <motion.div 
                key={anime.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="w-full h-full"
              >
                <AnimeCard anime={anime} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-muted-foreground">Nenhum anime encontrado :(</h2>
            <p className="mt-2 text-muted-foreground">Tente usar outros termos de busca.</p>
          </div>
        )}
      </main>
    </div>
  );
}
