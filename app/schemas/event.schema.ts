import { z } from 'zod';
import { htmlToText } from '~/schemas/post.schema';

const hasEmbeddedMedia = (html: string) => /<(img|iframe)\b/i.test(html);

export const eventSchema = z.object({
  title: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(z.string().min(1, 'Обязательное поле')),
  content: z
    .string('Добавьте описание события')
    .refine((val) => htmlToText(val).length > 0 || hasEmbeddedMedia(val), 'Добавьте описание события'),
  phone: z.string('Выберите телефон').min(1, 'Выберите телефон'),
  // UInputNumber отдаёт null, когда поле очищено
  age: z
    .number('Укажите возрастное ограничение')
    .int()
    .min(0, 'Не может быть отрицательным')
    .nullable()
    .refine((val) => val !== null, 'Укажите возрастное ограничение'),
  place: z.string('Выберите место проведения').min(1, 'Выберите место проведения'),
});
