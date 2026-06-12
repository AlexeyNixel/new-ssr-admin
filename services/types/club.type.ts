import type { File } from '../types/file.type';

export interface Club {
  id: string;
  name: string;
  description: string;
  member: string;
  worktime: string;
  workDirection: object;
  previewFileId: string;
  preview: File;
}

export interface ClubParams {
  include?: 'preview';
  limit?: number;
}
