import { useApi } from './index';
import type { Notification } from '../types/notification.type';
import { API_ENDPOINTS } from '../endpoints';

export const useNotificationApi = () => {
  const api = useApi();

  return {
    getAllNotifications: (params?: any) =>
      api.get<Notification[]>(API_ENDPOINTS.notification +  'expired', { params: params }),
    create: (data: any) => api.post(API_ENDPOINTS.notification, data),
    update: (id: string, data: any) =>
      api.patch(API_ENDPOINTS.notification, id, data),
  };
};
