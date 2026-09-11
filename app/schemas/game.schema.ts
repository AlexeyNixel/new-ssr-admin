import { z } from 'zod';

export const gameSchema = z.object({
  title: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(z.string().min(2, 'Должно быть минимум 2 символа')),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  playerMin: z.number().optional(),
  playerMax: z.number().optional(),
  playerAge: z.number().optional(),
  durationMin: z.number().optional(),
  durationMax: z.number().optional(),
  year: z.number().optional(),
  status: z.string('Обязательное поле'),
  place: z.string().optional(),
  comment: z.string().optional(),
  videoUrl: z.string().optional(),
});
