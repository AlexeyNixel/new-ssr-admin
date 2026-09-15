import type { IQuery } from './query.type';
import type { File } from '~~/services/types/file.type';

export interface ComicGenre {
  id: string;
  tag: string;
  title: string;
}

export interface ComicSeries {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface ComicImage {
  id: string;
  comicId: string;
  fileId: string;
  order: number;
  file: File;
}

export interface Comic {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string | null;
  author: string | null;
  illustrator: string | null;
  volumeNumber: number | null;
  year: number | null;
  ageRating: number | null;
  externalLink: string | null;
  isDeleted: boolean;
  seriesId: string | null;
  createdAt: string;
  updatedAt: string;
  images: ComicImage[];
  genres: Array<{ genre: ComicGenre }>;
  series: ComicSeries | null;
}

export interface ComicQuery extends IQuery {
  search?: string;
  seriesId?: string;
  ageMax?: number;
  yearFrom?: number;
  yearTo?: number;
}
