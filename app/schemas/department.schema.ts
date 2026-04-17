import { z } from 'zod';

export const departmentSchema = z.object({
  title: z.string('Обязательное поле').min(1, 'Обязательное поле'),
});
