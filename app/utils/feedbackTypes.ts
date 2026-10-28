import type { FeedbackType } from '~~/services/types/feedback.type';

/** Типы обращений «Ошибки и пожелания»: подпись, подсказка, иконка, цвет бейджа */
export const FEEDBACK_TYPES: Record<
  FeedbackType,
  { label: string; hint: string; icon: string; color: 'error' | 'warning' | 'info' }
> = {
  BUG: { label: 'Ошибка', hint: 'Что-то работает не так', icon: 'i-lucide-bug', color: 'error' },
  CHANGE: { label: 'Доработка', hint: 'Работает, но нужно переделать', icon: 'i-lucide-wrench', color: 'warning' },
  IDEA: { label: 'Идея', hint: 'Предложение нового', icon: 'i-lucide-lightbulb', color: 'info' },
};
