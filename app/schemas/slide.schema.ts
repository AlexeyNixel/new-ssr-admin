import { z } from 'zod';

export const slideSchema = z
  .object({
    imageFileId: z.string('Загрузите изображение').min(1, 'Загрузите изображение'),
    postId: z.string().optional(),
    url: z
      .string()
      .trim()
      .refine((val) => !val || /^https?:\/\//.test(val), 'Ссылка должна начинаться с http:// или https://')
      .optional(),
    // UInputNumber отдаёт null, когда поле очищено — сохраняем как 0
    slideOrder: z.number().int('Только целое число').min(0, 'Порядок должен быть больше или равен 0').nullable(),
    isDeleted: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const hasPostId = data.postId && data.postId.trim().length > 0;
      const hasExternalLink = data.url && data.url.trim().length > 0;
      return hasPostId || hasExternalLink;
    },
    {
      message: 'Выберите новость или укажите внешнюю ссылку',
      path: ['postId'],
    }
  );
