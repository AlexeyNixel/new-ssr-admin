import { z } from 'zod';

export const slideSchema = z
  .object({
    imageFileId: z.string().min(1, 'Изображение обязательно'),
    postId: z.string().optional(),
    url: z.string().optional(),
    slideOrder: z.number().min(0, 'Порядок должен быть больше или равен 0'),
    isDeleted: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const hasPostId = data.postId && data.postId.trim().length > 0;
      const hasExternalLink = data.url && data.url.trim().length > 0;
      return hasPostId || hasExternalLink;
    },
    {
      message: 'Необходимо указать либо ID новости, либо внешнюю ссылку',
      path: ['postId'],
    }
  );
