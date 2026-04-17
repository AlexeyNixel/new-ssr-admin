import { z } from 'zod';

export const notificationSchema = z.object({
  title: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(8, 'Должно быть минимум 8 символов')
        .refine((val) => val.length > 0)
    ),
  startTime: z.string('Обязательное поле'),
  endTime: z.string('Обязательное поле'),
  type: z.string('Обязательное поле'),
});
