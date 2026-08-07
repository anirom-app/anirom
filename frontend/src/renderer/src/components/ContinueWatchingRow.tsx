import { trpc } from '../main'
import { useAuthStore } from '../hooks/useAuthStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { ContinueWatchingCard } from './ContinueWatchingCard'

export function ContinueWatchingRow() {
  const token = useAuthStore((s) => s.token)
  const { data: history = [] } = trpc.getContinueWatching.useQuery(
    { token: token || '' }, 
    { enabled: !!token, refetchOnMount: 'always', refetchOnWindowFocus: true }
  )

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
  }, [history]);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!history || history.length === 0) return null

  return (
    <div className="w-full space-y-4 relative mb-8 group/row">
      <h2 className="text-2xl font-bold font-heading px-4 md:px-8">Continue Assistindo...</h2>
      
      <div className="relative">
        {showLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-black p-3 rounded-full shadow-xl transition-all flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/row:opacity-100"
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
          {history.map((item: any) => (
            <ContinueWatchingCard key={item.id} item={item} />
          ))}
        </div>

        {showRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-black p-3 rounded-full shadow-xl transition-all flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/row:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}


