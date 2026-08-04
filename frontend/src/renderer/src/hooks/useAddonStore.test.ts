import { useAddonStore } from './useAddonStore';

describe('useAddonStore', () => {
  beforeEach(() => {
    useAddonStore.setState({ addons: [] });
  });

  it('deve inicializar vazio (ou com default)', () => {
    const state = useAddonStore.getState();
    expect(state.addons).toEqual([]);
  });

  it('deve adicionar um novo addon', () => {
    const addon = { url: 'https://test.com/manifest.json', name: 'Test Addon' };
    useAddonStore.getState().addAddon(addon);
    
    const state = useAddonStore.getState();
    expect(state.addons).toHaveLength(1);
    expect(state.addons[0]).toEqual(addon);
  });

  it('não deve adicionar addon duplicado (mesma url)', () => {
    const addon = { url: 'https://test.com/manifest.json', name: 'Test Addon' };
    
    useAddonStore.getState().addAddon(addon);
    useAddonStore.getState().addAddon(addon);
    
    const state = useAddonStore.getState();
    expect(state.addons).toHaveLength(1);
  });

  it('deve remover um addon existente', () => {
    const addon1 = { url: 'https://test1.com/manifest.json', name: 'Test 1' };
    const addon2 = { url: 'https://test2.com/manifest.json', name: 'Test 2' };
    
    useAddonStore.getState().addAddon(addon1);
    useAddonStore.getState().addAddon(addon2);
    
    useAddonStore.getState().removeAddon(addon1.url);
    
    const state = useAddonStore.getState();
    expect(state.addons).toHaveLength(1);
    expect(state.addons[0].url).toBe(addon2.url);
  });
});
