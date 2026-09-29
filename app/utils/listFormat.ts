/*
 * Форматирование для списков админки (авто-импорт из app/utils).
 */

const STATIC_HOST = 'http://static.infomania.ru';

/** Полный адрес загруженного файла по его path из API. */
export const staticUrl = (path?: string | null) => (path ? `${STATIC_HOST}${path}` : '');

const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const relativeFormat = new Intl.RelativeTimeFormat('ru-RU', { numeric: 'auto' });

/** «24 сент. 2026 г.» */
export const formatDate = (value?: string | Date | null) => (value ? dateFormat.format(new Date(value)) : '—');

/** «24 сент. 2026 г., 11:31» */
export const formatDateTime = (value?: string | Date | null) =>
  value ? dateTimeFormat.format(new Date(value)) : '—';

/** «сегодня», «вчера», «3 дня назад», «через 2 недели», «5 мес. назад» */
export const formatRelative = (value?: string | Date | null) => {
  if (!value) return '';
  const diffMs = new Date(value).getTime() - Date.now();
  const days = Math.round(diffMs / 86_400_000);
  const abs = Math.abs(days);
  if (abs < 7) return relativeFormat.format(days, 'day');
  if (abs < 30) return relativeFormat.format(Math.round(days / 7), 'week');
  if (abs < 365) return relativeFormat.format(Math.round(days / 30), 'month');
  return relativeFormat.format(Math.round(days / 365), 'year');
};

/** plural(5, ['игрок', 'игрока', 'игроков']) → «игроков» */
export const plural = (count: number, forms: [string, string, string]) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
};

/** Диапазон «2–5», «от 2», «до 5» или '' */
export const formatRange = (min?: number | null, max?: number | null) => {
  if (min != null && max != null) return min === max ? `${min}` : `${min}–${max}`;
  if (min != null) return `от ${min}`;
  if (max != null) return `до ${max}`;
  return '';
};

/** Текст без HTML-тегов — для превью содержимого в списке. */
export const stripHtml = (html?: string | null) =>
  (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
