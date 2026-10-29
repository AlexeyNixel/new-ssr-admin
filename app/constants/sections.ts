/*
 * Разделы админки для настройки доступа сотрудников.
 * Ключи совпадают с backend/src/auth/sections.ts — бэкенд проверяет те же ключи.
 */

export interface AdminSection {
  key: string;
  label: string;
  /** Начало адреса страниц раздела в админке */
  path: string;
}

export interface AdminSectionGroup {
  label: string;
  sections: AdminSection[];
}

export const SECTION_GROUPS: AdminSectionGroup[] = [
  {
    label: 'Контент',
    sections: [
      { key: 'notifications', label: 'Уведомления', path: '/notification' },
      { key: 'posts', label: 'Посты', path: '/post' },
      { key: 'pages', label: 'Страницы', path: '/page' },
      { key: 'tags', label: 'Теги', path: '/tag' },
      { key: 'exhibitions', label: 'Выставки', path: '/exhibition' },
      { key: 'media', label: 'Медиатека', path: '/media' },
      { key: 'achievements', label: 'Достижения', path: '/achievement' },
    ],
  },
  {
    label: 'Библиотека',
    sections: [
      { key: 'books', label: 'Книги', path: '/book' },
      { key: 'collections', label: 'Сборники книг', path: '/collection' },
      { key: 'games', label: 'Игры', path: '/game' },
      { key: 'comics', label: 'Комиксы', path: '/comic' },
    ],
  },
  {
    label: 'Мероприятия',
    sections: [
      { key: 'events', label: 'События', path: '/event' },
      { key: 'slides', label: 'Слайды', path: '/slide' },
      { key: 'clubs', label: 'Клубы', path: '/club' },
    ],
  },
  {
    label: 'Структура сайта',
    sections: [
      { key: 'departments', label: 'Отделы', path: '/department' },
      { key: 'navigation', label: 'Навигация', path: '/navigation' },
      { key: 'map-points', label: 'Точки на карте', path: '/map-point' },
    ],
  },
  {
    label: 'Инструменты',
    sections: [
      { key: 'short-links', label: 'Короткие ссылки', path: '/short-link' },
      { key: 'link-check', label: 'Проверка ссылок', path: '/link-check' },
      { key: 'audit-log', label: 'Журнал изменений', path: '/audit-log' },
    ],
  },
];

export const ALL_SECTIONS = SECTION_GROUPS.flatMap((group) => group.sections);

/** Раздел по адресу страницы админки; undefined — страница общая (главная, обращения) */
export const sectionForPath = (path: string) =>
  ALL_SECTIONS.find((section) => path === section.path || path.startsWith(`${section.path}/`) || path.startsWith(`${section.path}?`));

/** Готовые наборы — отмечают галочки одним кликом; null — полный доступ */
export const SECTION_TEMPLATES: { label: string; icon: string; sections: string[] | null }[] = [
  { label: 'Библиотекарь', icon: 'i-lucide-library', sections: ['books', 'collections', 'games', 'comics', 'media'] },
  {
    label: 'Контент',
    icon: 'i-lucide-newspaper',
    sections: ['notifications', 'posts', 'pages', 'tags', 'exhibitions', 'media', 'slides', 'achievements'],
  },
  { label: 'Мероприятия', icon: 'i-lucide-calendar', sections: ['events', 'slides', 'clubs', 'media'] },
  { label: 'Полный доступ', icon: 'i-lucide-key-round', sections: null },
];
