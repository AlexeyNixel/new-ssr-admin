import { useApi } from './index';
import { API_ENDPOINTS } from '../endpoints';
import type { Post } from '../types/post.type';

export const usePostApi = () => {
  const api = useApi();

  return {
    getAllPosts: (params?: any) =>
      api.get<Post[]>(API_ENDPOINTS.posts, { params: params }),

    getOnePost: (id: string, params?: any) =>
      api.getOne<Post>(API_ENDPOINTS.posts, id, { params: params }),
    createPost: (data: any) => api.post<Post>(API_ENDPOINTS.posts, data),

    updatePost: (id: string, data: any) =>
      api.patch(API_ENDPOINTS.posts, id, data),
  };
};
