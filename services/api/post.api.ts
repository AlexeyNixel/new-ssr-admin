import { useApi } from './index';
import { API_ENDPOINTS } from '../endpoints';
import type { Post } from '../types/post.type';
import type { IQuery } from '~~/services/types/query.type';

export const usePostApi = () => {
  const api = useApi();

  return {
    getAllPosts: (params?: IQuery) =>
      api.get<Post[]>(API_ENDPOINTS.posts, { params }),

    getOnePost: (id: string, params?: IQuery) =>
      api.getOne<Post>(API_ENDPOINTS.posts, id, { params }),
    createPost: (data: Partial<Post>) => api.post(API_ENDPOINTS.posts, data),

    updatePost: (id: string, data: Partial<Post>) =>
      api.patch(API_ENDPOINTS.posts, id, data),
  };
};
