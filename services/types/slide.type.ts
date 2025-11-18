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
}
