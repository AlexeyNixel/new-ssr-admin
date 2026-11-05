import { z } from 'zod';

export const podcastSchema = z.object({
  title: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(z.string().min(2, 'Должно быть минимум 2 символа')),
  description: z.string().optional(),
});
