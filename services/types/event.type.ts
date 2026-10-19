/** Тип события для афиши на сайте (цвет плаката и фильтр) */
export type EventCategory = 'MASTER' | 'MUSIC' | 'GAME' | 'TALK';

export interface IEvent {
  id: string;
  title: string;
  content: string;
  phone: string;
  age: number;
  place: string;
  eventTime: string;
  /** null — тип не указан (старые события); сайт угадывает его по названию */
  category?: EventCategory | null;
  isDeleted: boolean;
}

export interface EventQuery {
  isDeleted?: boolean;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
