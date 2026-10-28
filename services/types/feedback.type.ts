export type FeedbackType = 'BUG' | 'CHANGE' | 'IDEA';

export interface Feedback {
  id: string;
  type: FeedbackType;
  title: string;
  description: string | null;
  /** Страница админки, с которой сообщили */
  pageUrl: string | null;
  screenshotId: string | null;
  screenshot: { id: string; path: string } | null;
  authorId: string | null;
  author: { id: string; name: string | null; username: string } | null;
  isDone: boolean;
  doneAt: string | null;
  /** Ответ разработчика */
  response: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackQuery {
  page?: number;
  limit?: number;
  status?: 'open' | 'done' | 'all';
  type?: FeedbackType;
  search?: string;
  mine?: string;
}

export interface FeedbackSummary {
  /** Сколько обращений ещё не выполнено */
  open: number;
  /** Новых обращений от других с момента since */
  newSince: number;
  /** Мои обращения, выполненные с момента since */
  doneForMe: Pick<Feedback, 'id' | 'title' | 'response' | 'doneAt'>[];
  /** Может отмечать выполнение и отвечать */
  canManage: boolean;
}

export type FeedbackPayload = Partial<
  Pick<Feedback, 'type' | 'title' | 'description' | 'pageUrl' | 'screenshotId' | 'isDone' | 'response' | 'isDeleted'>
>;
