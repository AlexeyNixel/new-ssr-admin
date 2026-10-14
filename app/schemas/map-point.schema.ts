import { z } from 'zod';

export const mapPointSchema = z.object({
  title: z.string('Обязательное поле').min(1, 'Обязательное поле'),
  description: z.string().optional(),
  content: z.string().optional(),
  imageFileId: z.string().nullish(),
  lat: z.number('Обязательное поле').optional(),
  lng: z.number('Обязательное поле').optional(),
  preset: z.string().optional(),
});
