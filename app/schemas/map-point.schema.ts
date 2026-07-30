import { z } from 'zod';

export const mapPointSchema = z.object({
  title: z.string('Обязательное поле').min(1, 'Обязательное поле'),
  description: z.string().optional(),
  content: z.string().optional(),
  image: z.string().optional(),
  lat: z.number('Обязательное поле'),
  lng: z.number('Обязательное поле'),
  preset: z.string().optional(),
});
