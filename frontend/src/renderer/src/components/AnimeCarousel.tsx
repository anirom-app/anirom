

import { useRef, useState, useEffect } from "react";

import { ChevronLeft, ChevronRight, Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { AnimeCard } from "./AnimeCard";

interface AnimeCarouselProps {
  title: string;
  animes: any[];
}

export function AnimeCarousel({ title, animes }: AnimeCarouselProps) {
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
  }, [animes]);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!animes || animes.length === 0) return null;

  return (
    <div className="w-full space-y-4 relative group/carousel">
      <h2 className="text-2xl font-bold font-heading px-4 md:px-8">{title}</h2>
      
      <div className="relative">
        {showLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-black p-3 rounded-full shadow-xl transition-all flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div 
          ref={rowRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto px-4 md:px-8 pb-4 hide-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {animes.map(anime => (
            <div key={anime.id} className="flex-none w-[160px] md:w-[220px]">
              <AnimeCard anime={anime} />
            </div>
          ))}
          
          {/* Card Ver Mais (Visual) */}
          <div className="flex-none w-[160px] md:w-[220px] aspect-[2/3] rounded-xl overflow-hidden border border-white/5 bg-white/5 flex items-center justify-center cursor-default group hover:bg-white/10 transition-colors shadow-xl">
            <span className="text-white/60 font-semibold group-hover:text-white transition-colors">Ver Mais</span>
          </div>
        </div>

        {showRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-black p-3 rounded-full shadow-xl transition-all flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
