import { z } from 'zod';

export const feedbackSchema = z.object({
  type: z.enum(['BUG', 'CHANGE', 'IDEA'], 'Выберите, что это'),
  title: z
    .string('Обязательное поле')
    .transform((val) => val.trim())
    .pipe(z.string().min(3, 'Опишите суть хотя бы в паре слов').max(200, 'Не длиннее 200 символов')),
});
