import { trpc } from '../main'
import { Link } from '@tanstack/react-router'
import { Play } from 'lucide-react'
import { Progress } from './ui/progress'
import { ParallaxCard } from './ParallaxCard'

export function ContinueWatchingCard({ item }: { item: any }) {
  const { data: animeDetails } = trpc.getAnimeDetails.useQuery({ animeId: item.animeId })
  
  const currentSeasonNumber = item.seasonNumber || 1
  const { data: episodes } = trpc.getAnimeEpisodes.useQuery({ animeId: item.animeId, seasonNumber: currentSeasonNumber })
  
  const animeName = animeDetails?.name || 'Carregando...'
  const episodeData = episodes?.find((ep: any) => String(ep.episode_number) === item.episodeNumber)
  
  const stillPath = episodeData?.still_path 
    ? `https://image.tmdb.org/t/p/w500${episodeData.still_path}`
    : (animeDetails?.backdrop_path ? `https://image.tmdb.org/t/p/w500${animeDetails.backdrop_path}` : 'https://via.placeholder.com/500x281?text=Sem+Imagem')

  const seasonObj = animeDetails?.seasons?.find((season: any) => season.season_number === currentSeasonNumber)
  const seasonName = seasonObj?.name || `Temporada ${currentSeasonNumber}`

  const progress = item.durationMillis > 0 ? (item.timestampMillis / item.durationMillis) * 100 : 0

  return (
    <Link 
      to={`/animes/${item.animeId}/${item.episodeNumber}`} 
      search={{ resume: Math.floor(item.timestampMillis / 1000) }}
      className="flex-shrink-0 block"
      style={{ width: '282px', height: '190px' }}
    >
      <ParallaxCard className="w-full h-full group bg-[#0a0a0a]">
        {/* Still Image with Cinematic Zoom */}
        <img 
          src={stillPath} 
          alt={animeName} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108" 
        />
        
        {/* Ambient Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-85 group-hover:opacity-95 transition-opacity duration-300 pointer-events-none" />
        
        {/* Floating Play Button with Backdrop Blur on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 pointer-events-none z-20">
           <div className="p-3.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-2xl transition-transform duration-300 group-hover:scale-110">
             <Play className="w-6 h-6 fill-white text-white translate-x-0.5" />
           </div>
        </div>

        {/* Glassmorphic Info Panel & Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 pointer-events-none z-20 transition-transform duration-300 group-hover:translate-y-[-2px]">
          <h3 className="text-white font-semibold text-xs md:text-sm line-clamp-1 group-hover:text-primary transition-colors tracking-tight">
            {animeName}
          </h3>
          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-medium mt-0.5 line-clamp-1">
            <span>{seasonName}</span>
            <span>•</span>
            <span className="text-zinc-300">Ep. {item.episodeNumber}{episodeData?.name ? ` - ${episodeData.name}` : ''}</span>
          </div>
          
          <div className="mt-2.5 h-1.5 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
             <Progress value={progress} className="h-full bg-primary" />
          </div>
        </div>
      </ParallaxCard>
    </Link>
  )
}
