import { useApi } from './index';
import type { Slide } from '../types/slide.type';
import { API_ENDPOINTS } from '../endpoints';

export const useSlideApi = () => {
  const api = useApi();
  return {
    getAllSlides: (params?: any) =>
      api.get<Slide[]>(API_ENDPOINTS.slides, { params }),
  };
};
