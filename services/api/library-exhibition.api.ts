import { useApi } from './index';
import type {
  LibraryExhibition,
  LibraryExhibitionPayload,
  LibraryExhibitionQuery,
} from '../types/library-exhibition.type';
import { API_ENDPOINTS } from '../endpoints';

export const useLibraryExhibitionApi = () => {
  const api = useApi();

  return {
    /** Список для админки: все статусы, пагинация и поиск по названию */
    getAll: (params?: LibraryExhibitionQuery) =>
      api.get<LibraryExhibition[]>(API_ENDPOINTS.libraryExhibitionAdmin, { params }),
    getOne: (id: string) => api.getById<LibraryExhibition>(API_ENDPOINTS.libraryExhibition, id),
    create: (data: LibraryExhibitionPayload) => api.post(API_ENDPOINTS.libraryExhibition, data),
    update: (id: string, data: Partial<LibraryExhibitionPayload> & { isHidden?: boolean }) =>
      api.patch(API_ENDPOINTS.libraryExhibition, id, data),
  };
};
