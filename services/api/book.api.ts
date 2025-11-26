import { useApi } from './index';
import type { Book, BookQuery } from '../types/book.type';
import { API_ENDPOINTS } from '../endpoints';

export const useBookApi = () => {
  const api = useApi();

  return {
    getAllBook: (params?: BookQuery) =>
      api.get<Book[]>(API_ENDPOINTS.book, { params }),

    getOneBook: (id: string, params?: BookQuery) =>
      api.getOne<BookQuery>(API_ENDPOINTS.book, id, { params }),

    createBook: (data: any) => api.post(API_ENDPOINTS.book, data),

    updateBook: (id: string, data: any) =>
      api.patch(API_ENDPOINTS.book, id, data),
  };
};
