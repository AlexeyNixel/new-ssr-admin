import { useApi } from './index';
import type { LinkCheckReport } from '../types/link-check.type';
import { API_ENDPOINTS } from '../endpoints';

export const useLinkCheckApi = () => {
  const api = useApi();

  return {
    latest: () => api.getWithoutPagination<LinkCheckReport | null>(API_ENDPOINTS.linkCheck),
    history: () => api.getWithoutPagination<LinkCheckReport[]>(`${API_ENDPOINTS.linkCheck}history`),
    run: () => api.post(`${API_ENDPOINTS.linkCheck}run`, {}) as Promise<LinkCheckReport>,
  };
};
