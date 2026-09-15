import { useApi } from './index';
import { API_ENDPOINTS } from '../endpoints';
import type {
  Comic,
  ComicGenre,
  ComicQuery,
  ComicSeries,
} from '~~/services/types/comic.type';

export const useComicApi = () => {
  const api = useApi();

  return {
    getAllComics: (params?: ComicQuery) =>
      api.get<Comic[]>(API_ENDPOINTS.comic, { params }),
    getOneComic: (id: string) => api.getById<Comic>(API_ENDPOINTS.comic, id),
    createComic: (data: Partial<Comic>) => api.post(API_ENDPOINTS.comic, data),
    updateComic: (id: string, data: Partial<Comic>) =>
      api.patch(API_ENDPOINTS.comic, id, data),

    getAllGenres: () =>
      api.getWithoutPagination<ComicGenre[]>(API_ENDPOINTS.comicGenre),
    createGenre: (data: { tag: string; title: string }) =>
      api.post(API_ENDPOINTS.comicGenre, data),
    updateGenre: (id: string, data: Partial<{ tag: string; title: string }>) =>
      api.patch(API_ENDPOINTS.comicGenre, id, data),

    getAllSeries: () =>
      api.getWithoutPagination<ComicSeries[]>(API_ENDPOINTS.comicSeries),
    createSeries: (data: { title: string; description?: string }) =>
      api.post(API_ENDPOINTS.comicSeries, data),
    updateSeries: (
      id: string,
      data: Partial<{ title: string; description: string }>
    ) => api.patch(API_ENDPOINTS.comicSeries, id, data),
  };
};
