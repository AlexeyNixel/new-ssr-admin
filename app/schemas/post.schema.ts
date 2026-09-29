import { z } from 'zod';

export const POST_DESCRIPTION_MAX = 512;

// Текст без тегов — чтобы пустой редактор (`<p></p>`) не проходил валидацию
export const htmlToText = (html?: string) =>
  (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hasEmbeddedMedia = (html: string) => /<(img|iframe)\b/i.test(html);

// originalSlug — адрес загруженной новости: у 180+ старых новостей в адресе
// кириллица и кавычки, их не валидируем, пока адрес не меняют.
export const createPostSchema = (originalSlug = '') => z.object({
  title: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(z.string().min(8, 'Должно быть минимум 8 символов')),
  description: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(16, 'Должно быть минимум 16 символов')
        .max(POST_DESCRIPTION_MAX, `Не должно превышать ${POST_DESCRIPTION_MAX} символов`)
    ),
  content: z
    .string('Добавьте текст новости')
    .refine((val) => htmlToText(val).length > 0 || hasEmbeddedMedia(val), 'Добавьте текст новости'),
  slug: z
    .string()
    .trim()
    .refine(
      (val) => val === originalSlug || /^[a-z0-9-]*$/.test(val),
      'Только латиница в нижнем регистре, цифры и дефис'
    )
    .optional(),
  departmentId: z.string('Выберите отдел').min(1, 'Выберите отдел'),
  previewFileId: z.string('Загрузите обложку').min(1, 'Загрузите обложку'),
});
