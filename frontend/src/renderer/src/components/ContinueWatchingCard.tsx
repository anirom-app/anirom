import { trpc } from '../main'
import { Link } from '@tanstack/react-router'
import { Play } from 'lucide-react'
import { Progress } from './ui/progress'

export function ContinueWatchingCard({ item }: { item: any }) {
  const { data: animeDetails } = trpc.getAnimeDetails.useQuery({ animeId: item.animeId })
  
  
  const { data: episodes } = trpc.getAnimeEpisodes.useQuery({ animeId: item.animeId, seasonNumber: 1 })
  
  const animeName = animeDetails?.name || 'Carregando...'
  const episodeData = episodes?.find((ep: any) => String(ep.episode_number) === item.episodeNumber)
  
  const stillPath = episodeData?.still_path 
    ? `https://image.tmdb.org/t/p/w500${episodeData.still_path}`
    : (animeDetails?.backdrop_path ? `https://image.tmdb.org/t/p/w500${animeDetails.backdrop_path}` : 'https://via.placeholder.com/500x281?text=Sem+Imagem')

  const progress = item.durationMillis > 0 ? (item.timestampMillis / item.durationMillis) * 100 : 0

  return (
    <Link 
      to={`/animes/${item.animeId}/${item.episodeNumber}`} 
      search={{ resume: Math.floor(item.timestampMillis / 1000) }}
      className="flex-shrink-0 relative group rounded-xl overflow-hidden cursor-pointer"
      style={{ width: '282px', height: '190px' }}
    >
      <img src={stillPath} alt={animeName} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
      
      {/* Overlay com gradiente para leitura */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
      
      {/* Play icon flutuante no meio ao passar o mouse */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 pointer-events-none">
         <Play className="w-12 h-12 text-white drop-shadow-lg" fill="currentColor" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
        <h3 className="text-white font-semibold text-sm line-clamp-1">{animeName}</h3>
        <p className="text-zinc-300 text-xs line-clamp-1">
          Episódio {item.episodeNumber}{episodeData?.name ? ` • ${episodeData.name}` : ''}
        </p>
        
        <div className="mt-2 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
           <Progress value={progress} className="h-full bg-neutral-700" />
        </div>
      </div>
    </Link>
  )
}
