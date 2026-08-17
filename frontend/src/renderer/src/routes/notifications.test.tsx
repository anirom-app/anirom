import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsPage } from './notifications';
import * as hooks from '@/hooks/useNotifications';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('NotificationsPage', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    vi.spyOn(hooks, 'useNotifications').mockReturnValue({
      notifications: [],
      unreadCount: 0,
      loading: true,
    });

    render(<NotificationsPage />);

    expect(screen.getByText('Notificações')).toBeInTheDocument();
    expect(screen.getByText('Carregando notificações...')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    vi.spyOn(hooks, 'useNotifications').mockReturnValue({
      notifications: [],
      unreadCount: 0,
      loading: false,
    });

    render(<NotificationsPage />);

    expect(screen.getByText('Tudo tranquilo por aqui')).toBeInTheDocument();
    expect(screen.getByText('Você não possui nenhuma notificação no momento. Volte mais tarde!')).toBeInTheDocument();
  });

  it('renders notifications list correctly', () => {
    vi.spyOn(hooks, 'useNotifications').mockReturnValue({
      notifications: [
        {
          id: '1',
          userId: 'user1',
          type: 'NEW_SEASON',
          title: 'Nova Temporada',
          message: 'Anime XYZ recebendo nova temporada.',
          read: false,
          active: true,
          createdAt: new Date().toISOString(),
        }
      ],
      unreadCount: 1,
      loading: false,
    });

    render(<NotificationsPage />);

    expect(screen.getByText('1 não lidas')).toBeInTheDocument();
    expect(screen.getByText('Nova Temporada')).toBeInTheDocument();
    expect(screen.getByText('Anime XYZ recebendo nova temporada.')).toBeInTheDocument();
  });
});

