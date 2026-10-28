import { useApi } from './index';
import type { IShortLink, ShortLinkQuery } from '../types/short-link.type';
import { API_ENDPOINTS } from '../endpoints';

export const useShortLinkApi = () => {
  const api = useApi();

  return {
    getAllShortLinks: (params?: ShortLinkQuery) =>
      api.get<IShortLink[]>(API_ENDPOINTS.shortLink, { params }),
    getOneShortLink: (id: string) =>
      api.getById<IShortLink>(API_ENDPOINTS.shortLink, id),
    updateShortLink: (id: string, data: Partial<IShortLink>) =>
      api.patch(API_ENDPOINTS.shortLink, id, data),
    createShortLink: (data: Partial<IShortLink>) =>
      api.post(API_ENDPOINTS.shortLink, data),
  };
};
