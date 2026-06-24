import { useApi } from './index';
import type { Page } from '../types/page.type';
import { API_ENDPOINTS } from '../endpoints';
import type { IQuery } from '~~/services/types/query.type';

export const usePageApi = () => {
  const api = useApi();

  return {
    getAllPages: (params?: IQuery) =>
      api.get<Page[]>(API_ENDPOINTS.page, { params }),

    getOnePage: (id: string) => api.getOne<Page>(API_ENDPOINTS.page, id),
    update: (id: string, data: Partial<Page>) => api.patch(API_ENDPOINTS.page, id, data),
    create: (data: Partial<Page>) => api.post(API_ENDPOINTS.page, data),
  };
};
