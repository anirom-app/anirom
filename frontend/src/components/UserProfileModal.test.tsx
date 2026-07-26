import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfileModal } from './UserProfileModal';
import { useAuthStore } from '@/hooks/useAuthStore';
import { api } from '@/services/api';

jest.mock('@/hooks/useAuthStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  api: {
    patch: jest.fn(),
  },
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('UserProfileModal', () => {
  const mockSetToken = jest.fn();
  
  beforeEach(() => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { nickname: 'TestUser', role: 'USER', photoUrl: 'http://test.com/photo.png' },
      token: 'fake-token',
      setToken: mockSetToken,
    });
    jest.clearAllMocks();
  });

  it('renders correctly and opens modal on click', () => {
    render(
      <UserProfileModal>
        <button data-testid="trigger-btn">Open Modal</button>
      </UserProfileModal>
    );

    expect(screen.queryByText('Configurações do Perfil')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('trigger-btn'));
    expect(screen.getByText('Configurações do Perfil')).toBeInTheDocument();
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });
});
