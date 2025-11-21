import { useApi } from './index';
import type { NavigationItem } from '../types/navigation-item.type';
import { API_ENDPOINTS } from '../endpoints';

export const useNavigationApi = () => {
  const api = useApi();

  return {
    getAllNavigation: async () =>
      api.getWithoutPagination<NavigationItem[]>(API_ENDPOINTS.navigation),

    updateBatchOrder: (data: [{ id: string; order: number }]) =>
      api.post(API_ENDPOINTS.navigation + 'batch-update', data),
  };
};
