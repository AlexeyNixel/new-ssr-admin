import { findPlacement, type PlacementTag } from '~~/services/ai/postTags';

/**
 * Размещение новости на главной: ровно один тег из «Анонсы / События / Актуальное / Партнёр»
 * (см. services/ai/postTags.ts) или ни одного. Выбирает чат-модель: тут важно понять,
 * о будущем или прошедшем мероприятии речь, — эмбеддинги этого не различают.
 *
 * Тело: { text, tags: {id,title}[], publishedDate?: 'YYYY-MM-DD', eventDate?: 'YYYY-MM-DD' }
 * Ответ: { placement: string | null } — id тега.
 */

const formatDate = (iso: string) => iso.split('-').reverse().join('.');
const isIsoDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Сравнение дат делает сервер: маленькая модель с этим не справляется, а готовый вывод читает хорошо. */
const describeDates = (publishedDate?: string, eventDate?: string) => {
  const lines: string[] = [];
  if (publishedDate) lines.push(`Дата публикации новости: ${formatDate(publishedDate)}.`);
  if (eventDate) {
    lines.push(`Дата мероприятия: ${formatDate(eventDate)}.`);
    if (publishedDate) {
      if (eventDate > publishedDate) lines.push('Мероприятие на момент публикации ЕЩЁ НЕ ПРОШЛО.');
      else if (eventDate < publishedDate) lines.push('Мероприятие на момент публикации УЖЕ ПРОШЛО.');
      else lines.push('Мероприятие проходит в день публикации.');
    }
  }
  return lines.join('\n');
};

export default defineEventHandler(async (event) => {
  const { body, text, tags } = await readTagRequest<{ publishedDate?: string; eventDate?: string }>(event);

  const options: Array<{ tag: TagOption; placement: PlacementTag }> = [];
  for (const tag of tags) {
    const placement = findPlacement(tag);
    if (placement) options.push({ tag, placement });
  }
  if (!options.length) return { placement: null };

  const dates = describeDates(
    isIsoDate(body?.publishedDate) ? body.publishedDate : undefined,
    isIsoDate(body?.eventDate) ? body.eventDate : undefined
  );

  const list = options.map(({ placement }, i) => `${i + 1}. ${placement.title} — ${placement.rule}`).join('\n');
  const system =
    'Ты помогаешь редактору сайта библиотеки решить, в какой блок главной страницы поставить новость. ' +
    `Варианты:\n${list}\n0. Ни один не подходит.\n` +
    'Главное — что описывает новость: будущее мероприятие, прошедшее мероприятие, важное объявление или новость партнёра. ' +
    'Ответь ТОЛЬКО одним номером.';
  const user = `${dates ? dates + '\n\n' : ''}Новость:\n${text}`;

  const [n] = pickNumbers(await ollamaChat(system, user), options.length);
  return { placement: n ? options[n - 1]!.tag.id : null };
});
