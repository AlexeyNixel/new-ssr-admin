import type { IQuery } from './query.type';
import type { File } from '~~/services/types/file.type';

/** Статус экземпляра игры (наличие в фонде). */
export type GameStatus =
  | 'IN_STOCK'
  | 'ON_HANDS'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'WRITTEN_OFF'
  | 'LOST'
  | 'DAMAGED';

export const GAME_STATUS_OPTIONS: { value: GameStatus; label: string }[] = [
  { value: 'IN_STOCK', label: 'В фонде' },
  { value: 'ON_HANDS', label: 'На руках' },
  { value: 'TEMPORARILY_UNAVAILABLE', label: 'Временно недоступна' },
  { value: 'WRITTEN_OFF', label: 'Списана' },
  { value: 'LOST', label: 'Утеряна' },
  { value: 'DAMAGED', label: 'Пришла в негодность' },
];

export interface GameGenre {
  id: string;
  tag: string;
  title: string;
}

export interface GameSeries {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface GameImage {
  id: string;
  gameId: string;
  fileId: string;
  order: number;
  file: File;
}

export interface Game {
  id: string;
  slug: string;
  externalId: string | null;
  title: string;
  shortDescription: string | null;
  description: string | null;
  playerMin: number | null;
  playerMax: number | null;
  playerAge: number | null;
  durationMin: number | null;
  durationMax: number | null;
  year: number | null;
  status: GameStatus;
  place: string | null;
  comment: string | null;
  isDeleted: boolean;
  videoUrl: string | null;
  seriesId: string | null;
  rulesFileId: string | null;
  createdAt: string;
  updatedAt: string;
  images: GameImage[];
  genres: Array<{ genre: GameGenre }>;
  series: GameSeries | null;
  rulesFile: File | null;
}

/** Форма создания/редактирования — плоские id вместо связей. */
export interface GameFormData {
  title: string;
  shortDescription: string;
  description: string;
  playerMin: number | undefined;
  playerMax: number | undefined;
  playerAge: number | undefined;
  durationMin: number | undefined;
  durationMax: number | undefined;
  year: number | undefined;
  status: GameStatus;
  place: string;
  comment: string;
  isDeleted: boolean;
  videoUrl: string;
  seriesId: string | undefined;
  rulesFileId: string | undefined;
  imageFileIds: string[];
  genreIds: string[];
}

export interface GameQuery extends IQuery {
  search?: string;
}
