import type { IQuery } from './query.type';

export type MediaFileType = 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'ARCHIVE' | 'OTHER';

export interface MediaFile {
  id: string;
  originalName: string;
  mimeType: string;
  type: MediaFileType;
  path: string;
  size: number;
  width: number | null;
  height: number | null;
  variants: Record<string, string> | null;
  createdAt: string;
  /** Сколько записей ссылаются на файл (превью, картинки) — упоминания в тексте не считаются */
  usedIn: number;
  /** Файл в своём бакете — его можно удалить (файлы старого сайта только для чтения) */
  canDelete: boolean;
}

export interface MediaQuery extends IQuery {
  type?: MediaFileType;
  /** Только не привязанные к записям */
  unused?: boolean;
}

export interface MediaUsage {
  type: string;
  id: string;
  title: string;
  via: 'relation' | 'text';
}
