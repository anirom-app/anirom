export interface Anime {
  id: string;
  titulo: string;
  sinopse: string;
  urlCapa: string;
  dataLancamento: string;
  createdAt?: string;
}

export interface AnimeRequestDTO {
  titulo: string;
  sinopse: string;
  urlCapa: string;
  dataLancamento: string;
}

export interface LoginResponseDTO {
  accessToken: string;
  require2Fa: boolean;
  preAuthToken?: string;
  nickname?: string;
  photoUrl?: string;
  role?: string;
}

export interface Episode {
  id: string;
  animeId: string;
  episodeNumber: number;
  title: string;
  magnetLink: string;
}

export interface CreateEpisodeRequest {
  animeId: string;
  episodeNumber: number;
  title: string;
  magnetLink: string;
}
