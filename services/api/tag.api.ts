import { useApi } from './index';
import { API_ENDPOINTS } from '../endpoints';
import type { Tag } from '~~/services/types/tag.type';

export const useTagApi = () => {
  const api = useApi();

  return {
    getAllTags: (params?: any) => api.get<Tag[]>(API_ENDPOINTS.tag, { params }),
    createTag: (data: any) => api.post(API_ENDPOINTS.tag, data),
  };
};
