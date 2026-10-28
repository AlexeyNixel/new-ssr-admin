import { useApi } from './index';
import type { AdminUser } from '../types/user.type';
import { API_ENDPOINTS } from '../endpoints';

export interface UserPayload {
  username?: string;
  name?: string | null;
  password?: string;
  isBlocked?: boolean;
  sections?: string[] | null;
}

export const useUserApi = () => {
  const api = useApi();

  return {
    getAll: () => api.getWithoutPagination<AdminUser[]>(API_ENDPOINTS.user),
    create: (data: UserPayload) => api.post(API_ENDPOINTS.user, data) as Promise<AdminUser>,
    update: (id: string, data: UserPayload) => api.patch(API_ENDPOINTS.user, id, data),
  };
};
