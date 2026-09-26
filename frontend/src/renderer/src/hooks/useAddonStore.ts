import { create } from 'zustand';
import { api } from '@/services/api';
import { useAuthStore } from '@/hooks/useAuthStore';

export interface Addon {
  id?: string;
  url: string;
  name: string;
  logo?: string;
}

interface AddonState {
  addons: Addon[];
  isLoading: boolean;
  fetchUserAddons: () => Promise<void>;
  addAddon: (addon: Addon) => Promise<void>;
  removeAddon: (url: string) => Promise<void>;
  resetAddons: () => void;
}

const DEFAULT_ADDONS: Addon[] = [
  { url: 'https://torrentio.strem.fun/manifest.json', name: 'Torrentio', logo: 'https://torrentio.strem.fun/static/logo.png' }
];

export const useAddonStore = create<AddonState>((set) => ({
  addons: DEFAULT_ADDONS,
  isLoading: false,

  fetchUserAddons: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      set({ isLoading: true });
      const res = await api.get<Addon[]>('/users/me/addons');
      if (Array.isArray(res.data) && res.data.length > 0) {
        set({ addons: res.data });
      }
    } catch (err) {
      console.warn('[useAddonStore] Falha ao sincronizar addons da conta do usuário:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addAddon: async (addon: Addon) => {
    // Atualização otimista imediata na UI
    set((state) => ({
      addons: state.addons.some(a => a.url === addon.url)
        ? state.addons
        : [...state.addons, addon]
    }));

    const token = useAuthStore.getState().token;
    if (token) {
      try {
        await api.post('/users/me/addons', {
          url: addon.url,
          name: addon.name,
          logo: addon.logo
        });
      } catch (err) {
        console.error('[useAddonStore] Erro ao salvar addon na conta:', err);
      }
    }
  },

  removeAddon: async (url: string) => {
    set((state) => ({
      addons: state.addons.filter(a => a.url !== url)
    }));

    const token = useAuthStore.getState().token;
    if (token) {
      try {
        await api.delete('/users/me/addons', {
          params: { url }
        });
      } catch (err) {
        console.error('[useAddonStore] Erro ao remover addon da conta:', err);
      }
    }
  },

  resetAddons: () => set({ addons: DEFAULT_ADDONS }),
}));
