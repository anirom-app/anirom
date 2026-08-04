import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Addon {
  url: string;
  name: string;
}

interface AddonState {
  addons: Addon[];
  addAddon: (addon: Addon) => void;
  removeAddon: (url: string) => void;
}

export const useAddonStore = create<AddonState>()(
  persist(
    (set) => ({
      addons: [
        { url: 'https://torrentio.strem.fun/manifest.json', name: 'Torrentio' }
      ],
      addAddon: (addon) => set((state) => ({ 
        addons: state.addons.some(a => a.url === addon.url) 
          ? state.addons 
          : [...state.addons, addon] 
      })),
      removeAddon: (url) => set((state) => ({ 
        addons: state.addons.filter(a => a.url !== url) 
      })),
    }),
    {
      name: 'addon-storage',
    }
  )
);
