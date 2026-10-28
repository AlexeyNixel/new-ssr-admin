import { useApi } from './index';
import type { Meta } from './index';
import type { MediaFile, MediaQuery, MediaUsage } from '../types/media.type';
import type { IQuery } from '../types/query.type';
import { API_ENDPOINTS } from '../endpoints';

export interface MediaList {
  data: MediaFile[];
  meta: Meta;
  /** Суммарный размер найденных файлов, байт */
  totalSize: number;
}

export const useMediaApi = () => {
  const api = useApi();

  return {
    // getWithoutPagination раскладывает options прямо в $fetch — отсюда params внутри;
    // get() не подходит: он теряет totalSize
    getAll: (params?: MediaQuery) =>
      api.getWithoutPagination<MediaList>(API_ENDPOINTS.media, { params } as unknown as IQuery),
    usage: (id: string) => api.getWithoutPagination<MediaUsage[]>(`${API_ENDPOINTS.media}${id}/usage`),
    remove: (id: string) => api.del(API_ENDPOINTS.media, id),
  };
};
