import { useApi } from './index';
import type { IMapPoint, MapPointQuery } from '../types/map-point.type';
import { API_ENDPOINTS } from '../endpoints';

export const useMapPointApi = () => {
  const api = useApi();

  return {
    getAllMapPoints: (params?: MapPointQuery) =>
      api.get<IMapPoint[]>(API_ENDPOINTS.mapPoint, { params }),
    getOneMapPoint: (id: string) =>
      api.getById<IMapPoint>(API_ENDPOINTS.mapPoint, id),
    updateMapPoint: (id: string, data: Partial<IMapPoint>) =>
      api.patch(API_ENDPOINTS.mapPoint, id, data),
    createMapPoint: (data: Partial<IMapPoint>) =>
      api.post(API_ENDPOINTS.mapPoint, data),
  };
};
