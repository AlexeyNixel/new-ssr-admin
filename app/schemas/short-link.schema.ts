import { z } from 'zod';

export const shortLinkSchema = z.object({
  title: z.string().max(200, 'Не длиннее 200 символов').optional(),
  url: z
    .string('Обязательное поле')
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(1, 'Обязательное поле')
        .max(2000, 'Слишком длинная ссылка')
        .regex(/^https?:\/\/\S+$/i, 'Ссылка должна начинаться с http:// или https://')
    ),
  // Пусто — хвост сгенерирует бэкенд
  slug: z
    .string()
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .max(100, 'Не длиннее 100 символов')
        .regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/i, 'Только латинские буквы, цифры и дефис (не в начале и не в конце)')
    )
    .optional(),
});
