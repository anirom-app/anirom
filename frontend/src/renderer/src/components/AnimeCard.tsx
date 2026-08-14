import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { ParallaxCard } from "./ParallaxCard";

interface AnimeCardProps {
  anime: any;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const tmdbUrl = anime.poster_path 
    ? `https://image.tmdb.org/t/p/w500${anime.poster_path}`
    : "https://via.placeholder.com/500x750?text=Sem+Capa";
  
  const imageUrl = anime.poster_path ? `anirom://media/?url=${encodeURIComponent(tmdbUrl)}` : tmdbUrl;

  return (
    <Link to="/animes/$animeId" params={{ animeId: anime.id.toString() }} className="block w-full h-full">
      <ParallaxCard className="w-full h-full aspect-[2/3] bg-[#0a0a0a] group">
        {/* Cover Image with Cinematic Zoom */}
        <img 
          src={imageUrl} 
          alt={anime.name} 
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108" 
        />
        
        {/* Top Left Rating Badge */}
        {anime.vote_average > 0 && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1.5 z-20 border border-white/10 shadow-md transition-transform duration-300 group-hover:scale-105">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 stroke-[1.5]" />
            <span className="text-white text-xs font-semibold tracking-wide">{anime.vote_average?.toFixed(1)}</span>
          </div>
        )}

        {/* Ambient Dark Gradient & Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />
        
        {/* Glassmorphic Bottom Panel */}
        <div className="absolute inset-x-0 bottom-0 pt-12 pb-3.5 px-3.5 flex flex-col justify-end pointer-events-none z-20 transition-transform duration-300 group-hover:translate-y-[-2px]">
          <h3 className="font-semibold text-xs md:text-sm text-white line-clamp-1 group-hover:text-primary transition-colors tracking-tight">
            {anime.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-medium text-zinc-400">
              {anime.first_air_date ? anime.first_air_date.substring(0, 4) : "N/A"}
            </span>
          </div>
        </div>
      </ParallaxCard>
    </Link>
  );
}
