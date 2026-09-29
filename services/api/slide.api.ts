import { useApi } from './index';
import type { Slide } from '../types/slide.type';
import { API_ENDPOINTS } from '../endpoints';
import type { IQuery } from '~~/services/types/query.type';

export const useSlideApi = () => {
  const api = useApi();
  return {
    getAllSlides: (params?: IQuery) =>
      api.get<Slide[]>(API_ENDPOINTS.slides, { params }),
    /*
     * GET /api/main-slider/:id на бэкенде — незаполненная заглушка Nest
     * («This action returns a #NaN mainSlider»), поэтому ищем слайд в списке,
     * который отдаёт полные данные вместе с картинкой. Когда бэкенд починят,
     * можно вернуть api.getById<Slide>(API_ENDPOINTS.slides, id).
     */
    getOneSlide: async (id: string): Promise<Slide> => {
      for (let page = 1; ; page++) {
        const res = await api.get<Slide[]>(API_ENDPOINTS.slides, {
          params: { isDeleted: true, limit: 100, page },
        });
        const slide = res.data?.find((item) => item.id === id);
        if (slide) return slide;
        if (!res.meta?.hasNext || !res.data?.length) throw new Error('Слайд не найден');
      }
    },
    updateSlide: (id: string, data: Partial<Slide>) =>
      api.patch(API_ENDPOINTS.slides, id, data),
    createSlide: (data: Partial<Slide>) => api.post(API_ENDPOINTS.slides, data),
  };
};
