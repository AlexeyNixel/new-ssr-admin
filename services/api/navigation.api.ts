import { useApi } from './index';
import type { NavigationItem } from '../types/navigation-item.type';
import { API_ENDPOINTS } from '../endpoints';

export const useNavigationApi = () => {
  const api = useApi();

  return {
    getAllNavigation: async (params?: { withoutDate?: boolean }) =>
      api.getWithoutPagination<NavigationItem[]>(API_ENDPOINTS.navigation),

    getAllNavigationWithoutTree: async () =>
      api.getWithoutPagination<NavigationItem[]>(
        API_ENDPOINTS.navigation + 'untree'
      ),

    create: async (data: Partial<NavigationItem>): Promise<unknown> =>
      api.post(API_ENDPOINTS.navigation, data),

    update: (id: string, data: Partial<NavigationItem>) =>
      api.patch(API_ENDPOINTS.navigation, id, data),

    updateBatchOrder: (data: { id: string; order: number }[]) =>
      api.postMany(API_ENDPOINTS.navigation + 'batch-update', data),
  };
};
