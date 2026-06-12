import { z } from 'zod';

export const pageSchema = z.object({
  title: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(z.string().min(1, 'Обязательное поле')),
  slug: z
    .string()
    .optional()
    .refine((val) => !val || /^[a-z0-9-]+$/.test(val), {
      message: 'Только латинские строчные буквы, цифры и дефис',
    }),
  content: z.string().optional(),
  isDeleted: z.boolean().default(false),
});
