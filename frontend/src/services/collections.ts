import { api } from "./api";

export interface SavedAnime {
  id: string;
  userId: string;
  animeId: string;
  active: boolean;
  savedAt: string;
}

export const toggleSavedAnime = async (animeId: string): Promise<void> => {
  await api.post(`/collections/me/${animeId}`);
};

export const getSavedAnimes = async (): Promise<SavedAnime[]> => {
  const response = await api.get('/collections/me');
  return response.data;
};
