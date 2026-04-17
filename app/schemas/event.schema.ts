import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string('Обязательное поле').min(1, 'Обязательное поле'),
  content: z.string('Обязательное поле').min(24, 'Минимум 24 символа'),
  phone: z.string('Обязательное поле'),
  age: z.number('Обязательное поле'),
  place: z.string('Обязательное поле'),
  eventTime: z.string('Обязательное поле'),
});
