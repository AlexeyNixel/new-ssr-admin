import { z } from 'zod';

// UInputNumber отдаёт null, когда поле очищено
const optionalInt = (min: number, message: string) =>
  z.number().int('Только целое число').min(min, message).nullable().optional();

export const gameSchema = z
  .object({
    title: z
      .string('Обязательное поле')
      .min(1, 'Обязательное поле')
      .transform((val) => val.trim())
      .pipe(z.string().min(2, 'Должно быть минимум 2 символа')),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    playerMin: optionalInt(1, 'Минимум 1 игрок'),
    playerMax: optionalInt(1, 'Минимум 1 игрок'),
    playerAge: optionalInt(0, 'Не может быть отрицательным'),
    durationMin: optionalInt(1, 'Минимум 1 минута'),
    durationMax: optionalInt(1, 'Минимум 1 минута'),
    year: optionalInt(1800, 'Проверьте год издания'),
    status: z.string('Обязательное поле'),
    place: z.string().optional(),
    comment: z.string().optional(),
    videoUrl: z
      .string()
      .trim()
      .refine((val) => !val || /^https?:\/\//.test(val), 'Ссылка должна начинаться с http:// или https://')
      .optional(),
  })
  .refine((data) => data.playerMin == null || data.playerMax == null || data.playerMin <= data.playerMax, {
    message: 'Не может быть меньше минимального',
    path: ['playerMax'],
  })
  .refine(
    (data) => data.durationMin == null || data.durationMax == null || data.durationMin <= data.durationMax,
    { message: 'Не может быть меньше минимальной', path: ['durationMax'] }
  );
