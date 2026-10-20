import { z } from 'zod';

export const bookSchema = z.object({
  title: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(z.string().min(2, 'Должно быть минимум 2 символа').max(200, 'Не должно превышать 200 символов')),
  // Библиографическая запись: из неё сайт берёт автора, издательство, год, ISBN
  description: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(z.string().min(10, 'Должно быть минимум 10 символов')),
  content: z.string().optional(),
  previewFileId: z.string('Добавьте обложку').min(1, 'Добавьте обложку'),
  place: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(z.string().min(2, 'Обязательное поле').max(200, 'Не должно превышать 200 символов')),
  litresLink: z
    .string()
    .trim()
    .refine((val) => !val || /^https?:\/\//.test(val), 'Ссылка должна начинаться с http:// или https://')
    .optional(),
});
