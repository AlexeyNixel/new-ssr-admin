import { useApi } from './index';
import type { Feedback, FeedbackPayload, FeedbackQuery, FeedbackSummary } from '../types/feedback.type';
import type { IQuery } from '../types/query.type';
import { API_ENDPOINTS } from '../endpoints';

export const useFeedbackApi = () => {
  const api = useApi();

  return {
    getAllFeedback: (params?: FeedbackQuery) =>
      api.get<Feedback[]>(API_ENDPOINTS.feedback, { params: params as IQuery }),
    getOneFeedback: (id: string) => api.getById<Feedback>(API_ENDPOINTS.feedback, id),
    // getWithoutPagination раскладывает options прямо в $fetch — отсюда params внутри
    getSummary: (since?: string | null) =>
      api.getWithoutPagination<FeedbackSummary>(API_ENDPOINTS.feedback + 'summary', {
        params: since ? { since } : undefined,
      } as unknown as IQuery),
    create: (data: FeedbackPayload) => api.post(API_ENDPOINTS.feedback, data),
    update: (id: string, data: FeedbackPayload) => api.patch(API_ENDPOINTS.feedback, id, data),
  };
};
