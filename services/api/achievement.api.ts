import { useApi } from './index';
import { API_ENDPOINTS } from '../endpoints';
import type { Achievement } from '../types/achievement.type';

export const useAchievementApi = () => {
  const api = useApi();

  return {
    /** Админка: все счётчики, включая скрытые */
    getAllAchievements: () =>
      api.getWithoutPagination<Achievement[]>(API_ENDPOINTS.achievementsAdmin),

    getOneAchievement: (id: string) =>
      api.getById<Achievement>(API_ENDPOINTS.achievements, id),

    createAchievement: (data: Partial<Achievement>) =>
      api.post(API_ENDPOINTS.achievements, data),

    updateAchievement: (id: string, data: Partial<Achievement>) =>
      api.patch(API_ENDPOINTS.achievements, id, data),
  };
};
