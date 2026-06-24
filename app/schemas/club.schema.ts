import { z } from 'zod';

export const clubSchema = z.object({
  name: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(z.string().min(2, 'Должно быть минимум 2 символа')),
  description: z.string().optional(),
  member: z.string().optional(),
  worktime: z.string().optional(),
});
