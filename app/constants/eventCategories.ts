import type { EventCategory } from '~~/services/types/event.type';

/**
 * Типы событий для афиши на сайте: от типа зависят цвет плаката и фильтр.
 * Цвета совпадают с плакатами на infomania.ru/afisha.
 */
export const EVENT_CATEGORIES: {
  value: EventCategory;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    value: 'MASTER',
    label: 'Мастер-класс',
    description: 'Мастер-классы, практикумы, «своими руками»',
    color: '#F2B632',
  },
  {
    value: 'MUSIC',
    label: 'Музыка',
    description: 'Концерты, музыкальные программы, встречи меломанов',
    color: '#7B3F8C',
  },
  {
    value: 'GAME',
    label: 'Игра или квест',
    description: 'Интеллектуальные игры, квизы, квесты, викторины, игротека',
    color: '#157486',
  },
  {
    value: 'TALK',
    label: 'Встреча или лекция',
    description: 'Лекции, литературные программы, уроки, творческие встречи',
    color: '#FFFFFF',
  },
];

/**
 * Подсказка типа по названию — тот же порядок правил, что на сайте
 * для старых событий без типа. Только подсказка: выбирает редактор.
 */
const SUGGEST_RULES: [EventCategory, RegExp][] = [
  ['MASTER', /мастер[-\s]?класс|практикум|своими руками/i],
  ['MUSIC', /концерт|музык|винил|jazzium|джаз|меломан|гостиная/i],
  ['GAME', /игр|квиз|квест|викторин|турнир|штурм|чемпионат/i],
];

export const suggestEventCategory = (title: string): EventCategory | undefined =>
  title.trim() ? (SUGGEST_RULES.find(([, rule]) => rule.test(title))?.[0] ?? 'TALK') : undefined;
