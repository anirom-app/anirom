import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, isTokenExpired } from './useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('deve inicializar com token e usuario nulos', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('deve definir token e dados do usuário via setToken', () => {
    const token = 'header.payload.signature';
    const user = { nickname: 'Otaku', role: 'USER' };

    useAuthStore.getState().setToken(token, user);

    const state = useAuthStore.getState();
    expect(state.token).toBe(token);
    expect(state.user).toEqual(user);
  });

  it('deve limpar token e usuario ao realizar logout', () => {
    useAuthStore.getState().setToken('token123', { nickname: 'Test' });
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('isTokenExpired deve retornar true para token nulo ou expirado/malformado', () => {
    expect(isTokenExpired(null)).toBe(true);
    // Token malformado de 3 partes (falha no atob/JSON.parse) -> entra no catch e retorna true
    expect(isTokenExpired('invalid.payload.signature')).toBe(true);
  });
});
