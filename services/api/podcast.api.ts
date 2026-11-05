import { useApi } from './index';
import type { Podcast, PodcastParams } from '../types/podcast.type';
import { API_ENDPOINTS } from '../endpoints';

export const usePodcastApi = () => {
  const api = useApi();

  return {
    getAllPodcasts: (params: PodcastParams) =>
      api.get<Podcast[]>(API_ENDPOINTS.podcast, { params }),
    getOnePodcast: (id: string) =>
      api.getById<Podcast>(API_ENDPOINTS.podcast, id, {
        params: { include: 'audio' },
      }),
    createPodcast: (data: Partial<Podcast>) =>
      api.post(API_ENDPOINTS.podcast, data),
    updatePodcast: (id: string, data: Partial<Podcast>) =>
      api.patch(API_ENDPOINTS.podcast, id, data),
  };
};
