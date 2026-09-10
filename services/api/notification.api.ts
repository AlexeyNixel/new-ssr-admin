import { useApi } from './index';
import type { Notification } from '../types/notification.type';
import { API_ENDPOINTS } from '../endpoints';
import type { IQuery } from '~~/services/types/query.type';

export const useNotificationApi = () => {
  const api = useApi();

  return {
    getAllNotifications: (params?: IQuery) =>
      api.get<Notification[]>(API_ENDPOINTS.notification, { params }),
    getOneNotification: (id: string) =>
      api.getById<Notification>(API_ENDPOINTS.notification, id),
    create: (data: Partial<Notification>) => api.post(API_ENDPOINTS.notification, data),
    update: (id: string, data: Partial<Notification>) =>
      api.patch(API_ENDPOINTS.notification, id, data),
  };
};
