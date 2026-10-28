import type { H3Event } from 'h3';

export interface TagOption {
  id: string;
  title: string;
}

// Для подбора тегов хватает начала новости, а короткий ввод заметно быстрее
const MAX_TEXT = 4000;

/** Общий разбор запроса подбора тегов: текст новости + список тегов {id, title}. */
export async function readTagRequest<T extends object>(event: H3Event) {
  const body = await readBody<T & { text?: string; tags?: TagOption[] }>(event);

  const text = (body?.text ?? '').toString().trim().slice(0, MAX_TEXT);
  const tags: TagOption[] = (Array.isArray(body?.tags) ? body.tags : [])
    .filter((t) => t && typeof t.id === 'string' && typeof t.title === 'string' && t.title.trim())
    .map((t) => ({ id: t.id, title: t.title.trim() }));

  if (!text) throw createError({ statusCode: 400, statusMessage: 'Пустой текст' });
  if (!tags.length) throw createError({ statusCode: 400, statusMessage: 'Не передан список тегов' });

  return { body, text, tags };
}
