import type { File } from '~~/services/types/file.type';
import type { Tag } from '~~/services/types/tag.type';

export interface Post {
  id: string;
  slug: string;

  publishedAt: string;
  /**
   * Дата мероприятия для новости-анонса (только дата, приходит как
   * «2026-10-25T00:00:00.000Z», шлём «2026-10-25»; null — нет). Сайт
   * показывает её вместо даты публикации, сортировка — по publishedAt.
   */
  eventDate?: string | null;
  createdAt: string;
  updatedAt: string;

  description: string;
  content: string;
  title: string;

  departmentId: string;
  previewFileId?: string;
  tagId: string[];
  fileId: string;

  isPublished: boolean;
  isDeleted: boolean;
  isPinned: boolean;

  preview: File;
  department: {
    title: string;
    id: string;
  };
  tags: Tag[];
}

// Тело запроса создания/обновления: теги передаются массивом id
export type PostPayload = Partial<Omit<Post, 'tags'>> & {
  tags?: string[];
};
