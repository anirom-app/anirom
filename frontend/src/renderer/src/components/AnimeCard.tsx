import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

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
      <motion.div 
        whileHover={{ scale: 1.05, zIndex: 10 }}
        whileTap={{ scale: 0.95 }}
        className="w-full h-full relative group cursor-pointer aspect-[2/3] rounded-xl overflow-hidden border border-white/5 shadow-xl bg-[#0a0a0a]"
      >
        <img 
          src={imageUrl} 
          alt={anime.name} 
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        
        {/* Top Left Badge */}
        {anime.vote_average > 0 && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md rounded-md px-2 py-1 flex items-center gap-1 z-10 border border-white/10">
            <Star className="w-3 h-3 text-white fill-transparent stroke-[2.5]" />
            <span className="text-white text-xs font-semibold">{anime.vote_average?.toFixed(1)}</span>
          </div>
        )}

        {/* Hover Darken */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {/* Normal State Bottom Title Overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-12 pb-3 px-3 flex flex-col justify-end pointer-events-none">
          <h3 className="font-semibold text-[13px] md:text-sm text-white line-clamp-1 group-hover:text-primary transition-colors">
            {anime.name}
          </h3>
          <span className="text-[11px] md:text-xs text-gray-400">
            {anime.first_air_date ? anime.first_air_date.substring(0, 4) : "N/A"}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
