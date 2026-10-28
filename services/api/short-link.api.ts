import { useApi } from './index';
import type { IShortLink, ShortLinkDayStat, ShortLinkQuery } from '../types/short-link.type';
import type { IQuery } from '../types/query.type';
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
    getStats: (id: string, days = 30) =>
      api.getWithoutPagination<ShortLinkDayStat[]>(`${API_ENDPOINTS.shortLink}${id}/stats`, {
        params: { days },
      } as unknown as IQuery),
  };
};
