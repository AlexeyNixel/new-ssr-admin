import { useApi } from './index';
import type { Book, BookCollection, BookPayload, BookQuery } from '../types/book.type';
import { API_ENDPOINTS } from '../endpoints';

export const useBookApi = () => {
  const api = useApi();

  return {
    getAllBook: (params?: BookQuery) =>
      api.get<Book[]>(API_ENDPOINTS.book, { params }),

    getOneBook: (id: string) =>
      api.getById<Book>(API_ENDPOINTS.book, id, { params: { include: 'preview' } }),

    createBook: (data: BookPayload) => api.post(API_ENDPOINTS.book, data),

    updateBook: (id: string, data: BookPayload) =>
      api.patch(API_ENDPOINTS.book, id, data),

    getAllCollections: (params?: BookQuery) =>
      api.get<BookCollection[]>(API_ENDPOINTS.collection, { params }),

    // isDeleted — вместе со скрытыми книгами: редактор должен видеть весь состав
    getOneCollection: (id: string) =>
      api.getById<BookCollection>(API_ENDPOINTS.collection, id, {
        params: { isDeleted: true },
      }),

    createCollection: (data: Partial<BookCollection>) => api.post(API_ENDPOINTS.collection, data),
    updateCollection: (id: string, data: Partial<BookCollection>) =>
      api.patch(API_ENDPOINTS.collection, id, data),

    /** Состав и порядок книг подборки: список заменяет прежний */
    setCollectionBooks: (id: string, bookIds: string[]) =>
      api.put(`${API_ENDPOINTS.collection}${id}/books`, { bookIds }),
  };
};
