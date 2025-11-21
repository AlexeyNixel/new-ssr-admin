import { useApi } from './index';
import type { EventQuery, IEvent } from '../types/event.type';
import { API_ENDPOINTS } from '../endpoints';

export const useEventApi = () => {
  const api = useApi();

  return {
    getAllEvents: (params?: EventQuery) =>
      api.get<IEvent[]>(API_ENDPOINTS.event, { params }),
    updateEvent: (id: string, data: any) =>
      api.patch(API_ENDPOINTS.event, id, data),
    createEvent: (data: Partial<IEvent>) => api.post(API_ENDPOINTS.event, data),
  };
};
