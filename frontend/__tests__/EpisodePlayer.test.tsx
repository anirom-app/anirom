import { render, screen, waitFor } from '@testing-library/react';
import EpisodePlayer from '../src/app/animes/[animeId]/[episodeNumber]/page';
import { getAnimeExternalIds } from '@/services/tmdb';
import { fetchTorrentioStreams } from '@/services/torrentio';
import { api } from '@/services/api';

jest.mock('next/navigation', () => ({
  useParams: () => ({ animeId: '123', episodeNumber: '1' }),
  useRouter: () => ({ push: jest.fn() })
}));

jest.mock('@/services/tmdb', () => ({
  getAnimeExternalIds: jest.fn()
}));

jest.mock('@/services/torrentio', () => ({
  fetchTorrentioStreams: jest.fn()
}));

jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn()
  }
}));

describe('EpisodePlayer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve exibir estado de loading inicialmente', () => {
    (getAnimeExternalIds as jest.Mock).mockResolvedValue(new Promise(() => {})); // Never resolves
    render(<EpisodePlayer />);
    expect(screen.getByText(/Iniciando carregamento...|Consultando base do TMDb.../i)).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro se o IMDb ID não for encontrado', async () => {
    (getAnimeExternalIds as jest.Mock).mockResolvedValue({ imdb_id: null });
    
    render(<EpisodePlayer />);
    
    await waitFor(() => {
      expect(screen.getByText(/Erro: IMDb ID não encontrado/i)).toBeInTheDocument();
    });
  });

  it('deve exibir a lista de fontes quando encontrado', async () => {
    (getAnimeExternalIds as jest.Mock).mockResolvedValue({ imdb_id: 'tt1234567' });
    (api.get as jest.Mock).mockResolvedValue({ data: { kitsuId: '999' } });
    (fetchTorrentioStreams as jest.Mock).mockResolvedValue([
      { name: '1080p', title: 'Stream 1', infoHash: 'abc', fileIdx: 0 }
    ]);

    render(<EpisodePlayer />);

    await waitFor(() => {
      expect(screen.getByText('Escolha uma Qualidade')).toBeInTheDocument();
    });
    
    expect(screen.getByText('1080p')).toBeInTheDocument();
  });
});
