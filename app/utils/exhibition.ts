/*
 * Виртуальные выставки: адреса пакета, обложки и страницы на сайте.
 * Пакет: `/dev/exhibitions/<slug>/index.html` или `/site/exhibition/<uuid>/<slug>/index.html`,
 * рядом лежит обложка `cover.jpg`.
 */
import type { Exhibition } from '~~/services/types/exhibition.type';

/** Имя папки пакета — адрес выставки на сайте */
export const exhibitionSlug = (exhibition: Pick<Exhibition, 'path'>) => exhibition.path.split('/').at(-2) ?? '';

/** `v` — сброс кеша после замены обложки */
export const exhibitionCover = (exhibition: Pick<Exhibition, 'path'>, v?: string | number) =>
  staticUrl(exhibition.path.replace(/index\.html$/, 'cover.jpg')) + (v ? `?v=${v}` : '');

export const exhibitionSiteUrl = (exhibition: Pick<Exhibition, 'path'>) =>
  `${(useRuntimeConfig().public.siteUrl as string).replace(/\/+$/, '')}/page/exhibition/${exhibitionSlug(exhibition)}`;

/** Выставки со старого сайта лежат в бакете `site` — он только для чтения */
export const exhibitionIsLegacy = (exhibition: Pick<Exhibition, 'path'>) => exhibition.path.startsWith('/site/');

export const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return '—';
  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: unit ? 1 : 0 })} ${units[unit]}`;
};
