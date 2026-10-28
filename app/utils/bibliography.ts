/**
 * Разбор библиографической записи книги (ГОСТ 7.0.100), которую редакторы
 * кладут в поле `description`, например:
 * «Шендеров, Герман Михайлович. Из бездны : [авторский сборник] / Г. М. Шендеров.
 *  – Москва : АСТ, 2024. – 512 с. – (Самая страшная книга). – ISBN 978-5-17-162700-3.»
 *
 * Копия `frontend/app/utils/bibliography.ts` с сайта (+ поле `title`): в
 * редакторе книги показываем, какие поля сайт распознает в записи. При
 * изменении правил разбора на сайте — обновить и здесь.
 *
 * Разбор «мягкий»: что не распознали — остаётся пустым. Если запись
 * не библиографическая (просто фраза), `isRecord` = false.
 */
export interface BookRecord {
  /** Основное заглавие: «Из бездны» — для автозаполнения названия */
  title?: string;
  /** «Герман Шендеров» — имя перед фамилией, без отчества */
  author?: string;
  /** Пометка после названия: «роман», «ранобэ», «авторский сборник» */
  note?: string;
  /** «Перевод с немецкого Д. Восканян» */
  translation?: string;
  city?: string;
  publisher?: string;
  year?: string;
  pages?: string;
  series?: string;
  isbn?: string;
  /** Похоже на библиографическую запись (есть год, страницы или ISBN) */
  isRecord: boolean;
}

/** Части записи разделяются « – » (тире или дефис с пробелами) */
const AREA_SPLIT = /\s[–—-]\s/;

/** Первое лицо из сведений об ответственности: «Г. М. Шендеров ; перевод…» → «Г. М. Шендеров» */
const firstResponsible = (responsibility: string) => {
  const first = responsibility.split(/\s;\s|,\s/)[0]?.replace(/\.$/, '').trim();
  return first && !/перевод|иллюстр|составит|редакт|автор-составитель/i.test(first) ? first : undefined;
};

export const parseBookRecord = (text?: string | null): BookRecord => {
  // Иногда перед записью через табуляцию вставлено название — берём саму запись
  const source = (text ?? '').split('\t').pop()!.replace(/\s+/g, ' ').trim();
  const result: BookRecord = { isRecord: false };
  if (!source) return result;

  result.isbn = source.match(/ISBN\s*([\dXx-]{10,17})/)?.[1];
  result.pages = source.match(/(\d+)\s*с\./)?.[1];
  result.series = source.match(/[–—-]\s*\(([^)]+)\)/)?.[1]?.trim();

  // Выходные данные: «Москва : INSPIRIA : Эксмо, 2024»
  const imprint = source.match(/[–—-]\s*([А-ЯЁA-Z][^–—:]+?)\s*:\s*([^–—]+?),\s*((?:1[89]|20)\d{2})/);
  if (imprint) {
    result.city = imprint[1]!.trim();
    result.publisher = imprint[2]!.replace(/\s*:\s*/g, ', ').trim();
    result.year = imprint[3];
  }

  result.isRecord = !!(result.year || result.pages || result.isbn);
  if (!result.isRecord) return result;

  const titleArea = source.split(AREA_SPLIT)[0] ?? '';
  const [beforeSlash = '', responsibility = ''] = titleArea.split(' / ');

  // Заголовок «Фамилия, Имя Отчество.» или «Фамилия, И. О.»
  const headingMatch = beforeSlash.match(/^([А-ЯЁA-Z][^,.]*),\s*([^.]+?)\.\s/);
  const surname = headingMatch?.[1]?.trim();
  const given = headingMatch?.[2]?.trim().split(/\s+/)[0];
  const responsible = firstResponsible(responsibility);

  if (surname && given && given.length > 3) {
    // Полное имя: «Шендеров, Герман Михайлович» → «Герман Шендеров»
    result.author = `${given} ${surname}`;
  } else if (responsible && (!surname || responsible.includes(surname))) {
    // Инициалы в заголовке или заголовка нет: «F. H. Burnett», «Ло Гуань-чжун»
    result.author = responsible;
  } else if (surname && given) {
    result.author = `${given}. ${surname}`;
  }

  // Пометка после « : » в области названия: «роман», «[авторский сборник]»
  const titlePart = headingMatch ? beforeSlash.slice(headingMatch[0].length) : beforeSlash;
  const [mainTitle = '', ...noteParts] = titlePart.split(' : ');
  const title = mainTitle.replace(/[.\s]+$/, '').trim();
  if (title) result.title = title;
  const note = noteParts.join(' : ').replace(/[[\]]/g, '').trim();
  if (note) result.note = note;

  const translation = responsibility.match(/(перевод\s+с\s+[а-яё]+)\s+([^;–—]+?)(?:\s*;|\.?$)/i);
  if (translation) {
    const who = translation[2]!.replace(/[[\]]/g, '').replace(/\.$/, '').trim();
    const lang = translation[1]!.replace(/^перевод/i, 'Перевод');
    result.translation = `${lang}: ${who}`;
  }

  return result;
};
