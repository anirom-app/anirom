import { create } from 'zustand'

interface ExploreState {
  page: number;
  sortBy: string;
  selectedGenres: string[];
  setPage: (page: number | ((p: number) => number)) => void;
  setSortBy: (sortBy: string) => void;
  setSelectedGenres: (genres: string[]) => void;
  reset: () => void;
}

export const useExploreStore = create<ExploreState>((set) => ({
  page: 1,
  sortBy: 'popularity.desc',
  selectedGenres: [],
  setPage: (page) => set((state) => ({ 
    page: typeof page === 'function' ? page(state.page) : page 
  })),
  setSortBy: (sortBy) => set({ sortBy, page: 1 }),
  setSelectedGenres: (selectedGenres) => set({ selectedGenres, page: 1 }),
  reset: () => set({ page: 1, sortBy: 'popularity.desc', selectedGenres: [] }),
}))
