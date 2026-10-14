import type { File } from './file.type';

export interface IMapPoint {
  id: string;
  title: string;
  description?: string;
  imageFileId?: string | null;
  image?: File | null;
  content?: string;
  lat: number;
  lng: number;
  preset?: string;
  isDeleted: boolean;
}

export interface MapPointQuery {
  isDeleted?: boolean;
  limit?: number;
  page?: number;
}
