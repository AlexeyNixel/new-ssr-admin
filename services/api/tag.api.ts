import { useApi } from './index';
import { API_ENDPOINTS } from '../endpoints';
import type { Tag } from '~~/services/types/tag.type';
import type { IQuery } from '~~/services/types/query.type';

export const useTagApi = () => {
  const api = useApi();

  return {
    getAllTags: (params?: IQuery) => api.get<Tag[]>(API_ENDPOINTS.tag, { params }),
    createTag: (data: Partial<Tag>) => api.post(API_ENDPOINTS.tag, data),
  };
};
