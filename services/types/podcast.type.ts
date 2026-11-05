import type { File } from './file.type';

export interface Podcast {
  id: string;
  title: string;
  description?: string | null;
  audioFileId?: string | null;
  /** Загруженный в Silo аудиофайл */
  audio?: File | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PodcastParams {
  include?: 'audio';
  limit?: number;
  isDeleted?: boolean;
}
