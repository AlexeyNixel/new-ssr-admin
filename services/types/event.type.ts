export interface IEvent {
  id: string;
  title: string;
  content: string;
  phone: string;
  age: number;
  place: string;
  eventTime: Date;
  isDeleted: boolean;
}

export interface EventQuery {
  isDeleted?: boolean;
  limit?: number;
  page?: number;
}
