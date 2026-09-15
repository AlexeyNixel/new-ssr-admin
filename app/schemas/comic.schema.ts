import { z } from 'zod';

export const comicSchema = z.object({
  title: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(z.string().min(2, 'Должно быть минимум 2 символа')),
  description: z.string().optional(),
  content: z.string().optional(),
  author: z.string().optional(),
  illustrator: z.string().optional(),
  volumeNumber: z.number().optional(),
  year: z.number().optional(),
  ageRating: z.number().optional(),
  externalLink: z.string().optional(),
});
