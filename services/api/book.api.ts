import { useApi } from './index';
import type { Book, BookCollection, BookQuery } from '../types/book.type';
import { API_ENDPOINTS } from '../endpoints';

export const useBookApi = () => {
  const api = useApi();

  return {
    getAllBook: (params?: BookQuery) =>
      api.get<Book[]>(API_ENDPOINTS.book, { params }),

    getOneBook: (id: string, params?: BookQuery) =>
      api.getOne<Book>(API_ENDPOINTS.book, id, { params }),

    createBook: (data: Partial<Book>) => api.post(API_ENDPOINTS.book, data),

    updateBook: (id: string, data: Partial<Book>) =>
      api.patch(API_ENDPOINTS.book, id, data),

    getAllCollections: (params?: BookQuery) =>
      api.get<BookCollection[]>(API_ENDPOINTS.collection, { params }),

    createCollection: (data: Partial<BookCollection>) => api.post(API_ENDPOINTS.collection, data),
    updateCollection: (id: string, data: Partial<BookCollection>) =>
      api.patch(API_ENDPOINTS.collection, id, data),
  };
};
