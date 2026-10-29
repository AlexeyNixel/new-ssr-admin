/*
 * Подписи и ссылки для журнала изменений (GET /audit-log): главная и раздел «Журнал изменений».
 */
import type { AuditLogEntry } from '~~/services/types/audit-log.type';

/** Человекочитаемые названия типов записей */
export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  Post: 'Новость',
  Department: 'Отдел',
  Tag: 'Тег',
  Achievement: 'Достижение',
  Book: 'Книга',
  BookCollection: 'Сборник книг',
  Club: 'Клуб',
  Event: 'Событие',
  MainSliderSlide: 'Слайд',
  MapPoint: 'Точка на карте',
  Notification: 'Уведомление',
  Page: 'Страница',
  Comic: 'Комикс',
  ComicGenre: 'Жанр комиксов',
  ComicSeries: 'Серия комиксов',
  Game: 'Игра',
  GameGenre: 'Жанр игр',
  GameSeries: 'Серия игр',
  NavigationItem: 'Пункт навигации',
  ShortLink: 'Короткая ссылка',
  Exhibition: 'Выставка',
  User: 'Пользователь',
  Feedback: 'Обращение',
};

export const AUDIT_ACTION_LABELS: Record<AuditLogEntry['action'], { label: string; color: 'success' | 'primary' }> = {
  CREATE: { label: 'Создано', color: 'success' },
  UPDATE: { label: 'Изменено', color: 'primary' },
};

export const auditEntityLabel = (type: string) => AUDIT_ENTITY_LABELS[type] ?? type;

/**
 * Адрес записи в админке. Только для типов с известным рабочим URL (docs/deep-links.md).
 * Страница открывается по slug — он приходит в entitySlug.
 */
export const auditEntityLink = (type: string, id: string, slug?: string | null): string | null => {
  switch (type) {
    case 'Post':
      return `/post/admin/${id}`;
    case 'Page':
      return slug ? `/page/admin/${slug}` : null;
    case 'Event':
      return `/event/admin/${id}`;
    case 'MainSliderSlide':
      return `/slide/admin/${id}`;
    case 'Book':
      return `/book/admin/${id}`;
    case 'BookCollection':
      return `/collection/admin/${id}`;
    case 'Game':
      return `/game/admin/${id}`;
    case 'Comic':
      return `/comic/admin/${id}`;
    case 'Department':
      return `/department?editId=${id}`;
    case 'Notification':
      return `/notification?editId=${id}`;
    case 'MapPoint':
      return `/map-point?editId=${id}`;
    case 'NavigationItem':
      return `/navigation?editId=${id}`;
    case 'Club':
      return `/club?editId=${id}`;
    case 'ShortLink':
      return `/short-link?editId=${id}`;
    case 'Achievement':
      return `/achievement?editId=${id}`;
    case 'Feedback':
      return `/feedback?editId=${id}`;
    case 'Exhibition':
      return '/exhibition';
    default:
      return null;
  }
};

export const auditLogLink = (entry: AuditLogEntry) =>
  auditEntityLink(entry.entityType, entry.entityId, entry.entitySlug);

export const auditAuthor = (entry: AuditLogEntry) => entry.user?.name || entry.user?.username || 'Система';
