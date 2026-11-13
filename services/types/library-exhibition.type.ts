import type { IQuery } from './query.type';

/**
 * Выставка в календаре — анонс физической выставки в библиотеке
 * (период дат на главной странице сайта). Не путать с виртуальной выставкой
 * (`services/types/exhibition.type.ts`): у анонса нет своей страницы и обложки.
 */
export interface LibraryExhibition {
  id: string;
  /** Название, до 300 символов */
  title: string;
  /** Пара строк пояснения, до 1000 символов */
  description: string | null;
  /** Первый день показа, ISO-строка */
  startsAt: string;
  /** Последний день показа включительно, ISO-строка */
  endsAt: string;
  isHidden: boolean;
  createdAt: string;
}

export interface LibraryExhibitionQuery extends IQuery {
  status?: 'visible' | 'hidden';
}

/** Тело создания и редактирования. Даты — ISO-строки. */
export interface LibraryExhibitionPayload {
  title: string;
  description?: string | null;
  /** ISO-строка, первый день показа */
  startsAt: string;
  /** ISO-строка, последний день показа включительно */
  endsAt: string;
}
