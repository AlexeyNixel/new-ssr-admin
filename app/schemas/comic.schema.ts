import { z } from 'zod';

// UInputNumber отдаёт null, когда поле очищено
const optionalInt = (min: number, message: string) =>
  z.number().int('Только целое число').min(min, message).nullable().optional();

export const comicSchema = z.object({
  title: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(z.string().min(2, 'Должно быть минимум 2 символа')),
  description: z.string().optional(),
  author: z.string().optional(),
  illustrator: z.string().optional(),
  // У некоторых серий есть нулевой том (приквел/пилот) — 0 допустим
  volumeNumber: optionalInt(0, 'Номер тома не может быть отрицательным'),
  year: optionalInt(1800, 'Проверьте год издания'),
  ageRating: optionalInt(0, 'Не может быть отрицательным'),
  externalLink: z
    .string()
    .trim()
    .refine((val) => !val || /^https?:\/\//.test(val), 'Ссылка должна начинаться с http:// или https://')
    .optional(),
});
