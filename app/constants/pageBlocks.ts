import type { PageBlock, PageBlockType } from '~~/services/types/page.type';

export interface PageBlockTypeMeta {
  type: PageBlockType;
  label: string;
  description: string;
  icon: string;
}

export const PAGE_BLOCK_TYPES: PageBlockTypeMeta[] = [
  {
    type: 'hero',
    label: 'Шапка (Hero)',
    description: 'Заголовок страницы и контактная карточка отдела',
    icon: 'i-heroicons-rectangle-group',
  },
  {
    type: 'stats',
    label: 'Статистика',
    description: 'Блок с цифрами и фактами',
    icon: 'i-heroicons-chart-bar',
  },
  {
    type: 'features',
    label: 'Направления',
    description: 'Сетка карточек направлений деятельности',
    icon: 'i-heroicons-squares-2x2',
  },
  {
    type: 'tags',
    label: 'Теги',
    description: 'Список тегов или категорий-«пилюль»',
    icon: 'i-heroicons-tag',
  },
  {
    type: 'advantages',
    label: 'Преимущества',
    description: 'Список преимуществ или условий с галочками',
    icon: 'i-heroicons-check-circle',
  },
  {
    type: 'highlight',
    label: 'Акцент',
    description: 'Акцентный блок проекта или анонса',
    icon: 'i-heroicons-megaphone',
  },
  {
    type: 'person',
    label: 'Персона',
    description: 'Карточка руководителя отдела',
    icon: 'i-heroicons-user-circle',
  },
  {
    type: 'banner',
    label: 'Баннер',
    description: 'Финальный баннер-призыв',
    icon: 'i-heroicons-megaphone-20-solid',
  },
  {
    type: 'richText',
    label: 'Текстовый блок',
    description: 'Произвольный HTML-контент',
    icon: 'i-heroicons-document-text',
  },
  {
    type: 'archive',
    label: 'Архив',
    description: 'Свёрнутый список датированных ссылок (выпуски, новости)',
    icon: 'i-heroicons-folder-open',
  },
];

export const getPageBlockMeta = (type: PageBlockType): PageBlockTypeMeta =>
  PAGE_BLOCK_TYPES.find((item) => item.type === type)!;

export const createPageBlock = (type: PageBlockType): PageBlock => {
  switch (type) {
    case 'hero':
      return {
        type: 'hero',
        title: '',
        icon: '',
        label: '',
        subtitle: '',
        contacts: {
          phone: '',
          address: '',
          email: '',
          workHours: '',
        },
      };
    case 'stats':
      return { type: 'stats', items: [] };
    case 'features':
      return { type: 'features', items: [] };
    case 'tags':
      return { type: 'tags', title: '', items: [] };
    case 'advantages':
      return { type: 'advantages', title: '', items: [] };
    case 'highlight':
      return { type: 'highlight', title: '', description: '', badge: '' };
    case 'person':
      return { type: 'person', name: '', position: '', icon: '' };
    case 'banner':
      return { type: 'banner', text: '' };
    case 'richText':
      return { type: 'richText', html: '' };
    case 'archive':
      return { type: 'archive', title: '', note: '', items: [] };
  }
};

/** Короткое описание блока для шапки карточки и предпросмотра. */
export const getPageBlockSummary = (block: PageBlock): string | undefined => {
  switch (block.type) {
    case 'hero':
      return block.title;
    case 'stats':
      return `Пунктов: ${block.items.length}`;
    case 'features':
      return `Направлений: ${block.items.length}`;
    case 'tags':
      return block.title || `Тегов: ${block.items.length}`;
    case 'advantages':
      return block.title;
    case 'highlight':
      return block.title;
    case 'person':
      return block.name;
    case 'banner':
      return block.text;
    case 'richText':
      return 'Произвольный HTML-контент';
    case 'archive':
      return block.title || `Ссылок: ${block.items.length}`;
  }
};
