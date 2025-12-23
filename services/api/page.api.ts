import { useApi } from './index';
import type { Page } from '../types/page.type';
import { API_ENDPOINTS } from '../endpoints';

export const usePageApi = () => {
  const api = useApi();

  return {
    getAllPages: (params: any) =>
      api.get<Page[]>(API_ENDPOINTS.page, { params: params }),

    getOnePage: (id: string) => api.getOne<Page>(API_ENDPOINTS.page, id),
    update: (id: string, data: any) => api.patch(API_ENDPOINTS.page, id, data),
    create: (data: any) => api.post(API_ENDPOINTS.page, data),
  };
};
