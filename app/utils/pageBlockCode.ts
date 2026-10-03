import type { PageBlock, PageBlockType } from '~~/services/types/page.type';
import { PAGE_BLOCK_TYPES, createPageBlock } from '~/constants/pageBlocks';

/** Поля-массивы у блоков: если в коде их нет или там не массив — подставляем []. */
const ARRAY_FIELDS: Partial<Record<PageBlockType, string>> = {
  stats: 'items',
  features: 'items',
  tags: 'items',
  advantages: 'items',
  archive: 'items',
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBlockType = (type: unknown): type is PageBlockType =>
  PAGE_BLOCK_TYPES.some((meta) => meta.type === type);

/** Убирает висячие запятые перед `]`/`}` — частая ошибка при ручном копировании. */
const stripTrailingCommas = (text: string) =>
  text.replace(/,\s*([\]}])/g, '$1');

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    try {
      return JSON.parse(stripTrailingCommas(text));
    } catch (error) {
      throw new Error(`Некорректный JSON: ${(error as Error).message}`);
    }
  }
};

/** Дополняет блок недостающими полями по умолчанию, чтобы формы редактирования не падали. */
const normalizeBlock = (raw: Record<string, unknown>): PageBlock => {
  const type = raw.type as PageBlockType;
  const defaults = createPageBlock(type) as unknown as Record<string, unknown>;
  const block: Record<string, unknown> = { ...defaults, ...raw };

  const arrayField = ARRAY_FIELDS[type];
  if (arrayField && !Array.isArray(block[arrayField])) block[arrayField] = [];

  if (type === 'hero') {
    block.contacts = {
      ...(defaults.contacts as object),
      ...(isObject(raw.contacts) ? raw.contacts : {}),
    };
  }

  return block as unknown as PageBlock;
};

/**
 * Разбирает код блоков, вставленный текстом. Понимает:
 * один блок `{ "type": ... }`, массив блоков `[...]` или объект страницы `{ "blocks": [...] }`.
 */
export const parsePageBlocksCode = (text: string): PageBlock[] => {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const data = parseJson(trimmed);
  const list = Array.isArray(data)
    ? data
    : isObject(data) && Array.isArray(data.blocks)
      ? data.blocks
      : [data];

  if (!list.length) throw new Error('В коде нет ни одного блока');

  return list.map((raw, index) => {
    const position = list.length > 1 ? `Блок №${index + 1}: ` : '';

    if (!isObject(raw)) throw new Error(`${position}ожидается объект блока`);
    if (!('type' in raw)) throw new Error(`${position}не указано поле "type"`);
    if (!isBlockType(raw.type)) {
      const known = PAGE_BLOCK_TYPES.map((meta) => meta.type).join(', ');
      throw new Error(
        `${position}неизвестный тип "${String(raw.type)}". Доступные: ${known}`
      );
    }

    return normalizeBlock(raw);
  });
};

export const stringifyPageBlocks = (blocks: PageBlock | PageBlock[]) =>
  JSON.stringify(blocks, null, 2);
