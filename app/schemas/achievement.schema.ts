import { z } from 'zod';

export const achievementSchema = z.object({
  label: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(2, 'Минимум 2 символа')
        .max(40, 'Максимум 40 символов')
    ),
  count: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .max(12, 'Максимум 12 символов')
        .regex(/^[\d\s+.,]+$/, 'Только число: 1200 или 12 000')
    ),
});
