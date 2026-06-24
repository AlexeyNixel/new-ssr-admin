import { useApi } from './index';
import type { Slide } from '../types/slide.type';
import { API_ENDPOINTS } from '../endpoints';
import type { IQuery } from '~~/services/types/query.type';

export const useSlideApi = () => {
  const api = useApi();
  return {
    getAllSlides: (params?: IQuery) =>
      api.get<Slide[]>(API_ENDPOINTS.slides, { params }),
    updateSlide: (id: string, data: Partial<Slide>) =>
      api.patch(API_ENDPOINTS.slides, id, data),
    createSlide: (data: Partial<Slide>) => api.post(API_ENDPOINTS.slides, data),
  };
};
