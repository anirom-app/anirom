import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { keepPreviousData } from '@tanstack/react-query'
import { trpc } from '@/main'
import { Navbar } from '@/components/Navbar'
import { AnimeCard } from '@/components/AnimeCard'
import { AnimeCarousel } from '@/components/AnimeCarousel'
import { Button } from '@/components/ui/button'
import { Loader2, Filter, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'

export const Route = createFileRoute('/explore')({
  component: ExplorePage,
})

const GENRES = [
  { id: '10759', name: 'Ação e Aventura' },
  { id: '35', name: 'Comédia' },
  { id: '18', name: 'Drama' },
  { id: '10765', name: 'Sci-Fi & Fantasia' },
  { id: '9648', name: 'Mistério' },
  { id: '10749', name: 'Romance' },
  { id: '80', name: 'Crime / Suspense' },
  { id: '10768', name: 'Guerra & Política' },
  { id: '37', name: 'Faroeste' },
  { id: '10751', name: 'Família' },
  { id: '10762', name: 'Infantil / Kids' },
  { id: '10766', name: 'Novela / Drama Longo' }
]

function GenreRow({ genre, sortBy, onViewMore }: { genre: { id: string; name: string }, sortBy: string, onViewMore: () => void }) {
  const { data, isLoading } = trpc.getExploreAnimes.useQuery(
    { page: 1, sortBy, genres: [genre.id] },
    { staleTime: 1000 * 60 * 5 } // cache for 5 minutes
  )

  if (isLoading || !data || data.results.length === 0) return null

  return <AnimeCarousel title={genre.name} animes={data.results} onViewMore={onViewMore} />
}

function ExplorePage() {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('popularity.desc')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  
  // Popover state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [tempSelectedGenres, setTempSelectedGenres] = useState<string[]>([])

  // Only used when there are filters applied
  const { data, isLoading, isPlaceholderData } = trpc.getExploreAnimes.useQuery(
    { page, sortBy, genres: selectedGenres },
    { 
      placeholderData: keepPreviousData,
      enabled: selectedGenres.length > 0 
    }
  )

  const handleNextPage = () => {
    if (data && page < data.total_pages) {
      setPage((p) => p + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((p) => p - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleApplyFilters = () => {
    setSelectedGenres(tempSelectedGenres)
    setPage(1)
    setIsFilterModalOpen(false)
  }

  const toggleTempGenre = (genreId: string) => {
    setTempSelectedGenres(prev => 
      prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 flex overflow-x-hidden">
      <Navbar />
      <main className="flex-1 min-w-0 overflow-x-hidden md:ml-20 px-6 md:px-16 pt-24 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold font-heading mb-2">
              {selectedGenres.length === 0 ? "Descobrir Categorias" : "Animes Filtrados"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {selectedGenres.length === 0 
                ? "Navegue por diversos gêneros" 
                : `${selectedGenres.length} gênero(s) selecionado(s)`}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setPage(1); }}>
              <SelectTrigger className="w-[180px] bg-black/40 border-white/10">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity.desc">Mais Populares</SelectItem>
                <SelectItem value="vote_average.desc">Melhor Avaliados</SelectItem>
                <SelectItem value="first_air_date.desc">Mais Recentes</SelectItem>
              </SelectContent>
            </Select>

            <Popover 
              open={isFilterModalOpen} 
              onOpenChange={(open) => {
                if (open) setTempSelectedGenres(selectedGenres)
                setIsFilterModalOpen(open)
              }}
            >
              <PopoverTrigger asChild>
                <Button variant={selectedGenres.length > 0 ? "default" : "outline"} className={`bg-black/40 border-white/10 gap-2 hover:bg-white/10 ${selectedGenres.length > 0 ? 'bg-primary text-white hover:bg-primary/90' : ''}`}>
                  <Filter className="w-4 h-4" />
                  Filtros {selectedGenres.length > 0 && `(${selectedGenres.length})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 bg-[#0a0a0a] border border-white/10 text-white shadow-2xl p-4 flex flex-col">
                <div className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                  Gêneros
                </div>
                
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 hide-scrollbar">
                  {GENRES.map((genre) => (
                    <div key={genre.id} className="flex items-center space-x-3 group">
                      <Checkbox 
                        id={`genre-${genre.id}`}
                        checked={tempSelectedGenres.includes(genre.id)}
                        onCheckedChange={() => toggleTempGenre(genre.id)}
                        className="w-5 h-5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors"
                      />
                      <label 
                        htmlFor={`genre-${genre.id}`}
                        className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer group-hover:text-primary transition-colors flex-1"
                      >
                        {genre.name}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                  <Button variant="ghost" className="text-primary hover:text-primary/80 hover:bg-transparent px-2" onClick={() => setTempSelectedGenres([])}>
                    Limpar
                  </Button>
                  <Button onClick={handleApplyFilters} className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                    Aplicar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* MODO DESCOBERTA (Sem Filtros) */}
        {selectedGenres.length === 0 ? (
          <div className="space-y-12 pb-10">
            {GENRES.map(genre => (
              <GenreRow 
                key={genre.id} 
                genre={genre} 
                sortBy={sortBy} 
                onViewMore={() => {
                  setSelectedGenres([genre.id])
                  setTempSelectedGenres([genre.id])
                  setPage(1)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            ))}
          </div>
        ) : (
          /* MODO GRID (Com Filtros) */
          <>
            {isLoading && page === 1 ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 transition-opacity duration-300 ${isPlaceholderData ? 'opacity-50' : 'opacity-100'}`}>
                  {data?.results?.map((anime: any) => (
                    <AnimeCard key={anime.id} anime={anime} />
                  ))}
                </div>

                {data?.results?.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <p>Nenhum anime encontrado para os gêneros selecionados.</p>
                  </div>
                )}

                {data && data.total_pages > 1 && (
                  <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-4">
                    <Button 
                      variant="outline" 
                      onClick={handlePrevPage} 
                      disabled={page === 1 || isPlaceholderData}
                      className="bg-black/40 border-white/10 hover:bg-white/10"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                    </Button>
                    
                    <span className="text-muted-foreground">
                      Página <strong className="text-white">{page}</strong> de {data.total_pages}
                    </span>

                    <Button 
                      variant="outline" 
                      onClick={handleNextPage} 
                      disabled={page >= data.total_pages || isPlaceholderData}
                      className="bg-black/40 border-white/10 hover:bg-white/10"
                    >
                      Próxima <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
