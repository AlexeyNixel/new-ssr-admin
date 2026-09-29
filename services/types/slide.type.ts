import type { File } from './file.type';

export interface Slide {
  id: string;
  createdAt: string;
  isDeleted: boolean;
  slideOrder: number;
  postId: string;
  imageFileId: string;
  url: string;
  image: File;
  /** Привязанная новость — приходит в списке слайдов */
  post?: { id: string; title: string; slug?: string } | null;
}
