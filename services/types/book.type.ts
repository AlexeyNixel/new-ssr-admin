import type { IQuery } from './query.type';
import type { File } from '~~/services/types/file.type';

export interface Book {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  previewFileId: string;
  isDeleted: boolean;
  isVideo: boolean;
  place: string;
  litresLink: string | null;
  createdAt: string;
  /** Подборки книги — только в GET /api/book/:id */
  collections?: Pick<BookCollection, 'id' | 'label'>[];
  preview: File;
}

/** Тело создания/изменения книги: подборки — списком id (заменяет прежний) */
export type BookPayload = Omit<Partial<Book>, 'collections'> & { collections?: string[] };

export interface BookCollection {
  id: string;
  /** Адрес страницы на сайте: /books/collections/<slug> */
  slug: string;
  label: string;
  description?: string | null;
  previewFileId?: string | null;
  isDeleted: boolean;
  createdAt: string;
  preview?: File | null;
  /** Число видимых книг (в списке и в карточке) */
  bookCount?: number;
  /** Обложки первых книг — для веера на карточке (только в списке) */
  covers?: Pick<Book, 'id' | 'title' | 'preview'>[];
  /** Книги по порядку (только в GET /:id) */
  books?: Book[];
}

export interface BookQuery extends IQuery {
  isVideo?: boolean;
  include?: string;
}
