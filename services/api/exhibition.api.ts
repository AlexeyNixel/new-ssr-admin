import { useApi } from './index';
import type { Exhibition, ExhibitionQuery } from '../types/exhibition.type';
import { API_ENDPOINTS } from '../endpoints';

export const useExhibitionApi = () => {
  const api = useApi();

  return {
    getAll: (params?: ExhibitionQuery) => api.get<Exhibition[]>(API_ENDPOINTS.exhibitionsAdmin, { params }),
    update: (id: string, data: Partial<Pick<Exhibition, 'title' | 'isHidden'>>) =>
      api.patch(API_ENDPOINTS.exhibitions, id, data),
    /** FormData: file (ZIP), cover (картинка, необязательно), title */
    upload: (body: FormData) => api.postFile(API_ENDPOINTS.uploadExhibition, body),
    replaceCover: (id: string, body: FormData) => api.postFile(`${API_ENDPOINTS.exhibitions}${id}/cover`, body),
  };
};
