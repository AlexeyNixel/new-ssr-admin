import type { File } from '~~/services/types/file.type';
import type { Tag } from '~~/services/types/tag.type';

export interface Post {
  id: string;
  slug: string;

  publishedAt: string;
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
