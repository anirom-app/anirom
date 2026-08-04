import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProxyState {
  isProxyEnabled: boolean;
  customProxies: string;
  setIsProxyEnabled: (enabled: boolean) => void;
  setCustomProxies: (proxies: string) => void;
}

export const useProxyStore = create<ProxyState>()(
  persist(
    (set) => ({
      isProxyEnabled: false,
      customProxies: "",
      setIsProxyEnabled: (enabled) => set({ isProxyEnabled: enabled }),
      setCustomProxies: (proxies) => set({ customProxies: proxies }),
    }),
    {
      name: 'proxy-settings-storage',
    }
  )
);
