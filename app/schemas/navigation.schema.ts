import { z } from 'zod';

export const navigationSchema = z.object({
  title: z.string('Обязательное поле').min(1, 'Обязательное поле'),
  to: z.string('Обязательное поле').min(1, 'Обязательное поле'),
  target: z.string('Выберите тип').min(1, 'Выберите тип'),
  description: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
});
