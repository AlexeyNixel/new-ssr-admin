import type { IQuery } from './query.type';

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
  litresLink: string;
  createdAt: string;
  categories: BookCategory[];
}

export interface BookCategory {
  id: string;
  label: string;
}

export interface BookQuery extends IQuery {
  isVideo?: boolean;
}
