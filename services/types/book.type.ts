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
  litresLink: string;
  createdAt: string;
  categories: BookCollection[];
  preview: File;
}

export interface BookCollection {
  id: string;
  label: string;
  previewFileId: string;
  createdAt: string;
  preview: File;
}

export interface BookQuery extends IQuery {
  isVideo?: boolean;
  include?: string;
}
