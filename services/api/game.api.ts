import { useApi } from './index';
import { API_ENDPOINTS } from '../endpoints';
import type {
  Game,
  GameGenre,
  GameQuery,
  GameSeries,
} from '~~/services/types/game.type';

export const useGameApi = () => {
  const api = useApi();

  return {
    getAllGames: (params?: GameQuery) =>
      api.get<Game[]>(API_ENDPOINTS.game, { params }),
    getOneGame: (id: string) => api.getById<Game>(API_ENDPOINTS.game, id),
    createGame: (data: Partial<Game>) => api.post(API_ENDPOINTS.game, data),
    updateGame: (id: string, data: Partial<Game>) =>
      api.patch(API_ENDPOINTS.game, id, data),

    // Список без пагинации — эндпоинты отдают массив без {data, meta}.
    getAllGenres: () => api.getWithoutPagination<GameGenre[]>(API_ENDPOINTS.gameGenre),
    createGenre: (data: { tag: string; title: string }) =>
      api.post(API_ENDPOINTS.gameGenre, data),
    updateGenre: (id: string, data: Partial<{ tag: string; title: string }>) =>
      api.patch(API_ENDPOINTS.gameGenre, id, data),

    getAllSeries: () => api.getWithoutPagination<GameSeries[]>(API_ENDPOINTS.gameSeries),
    createSeries: (data: { title: string; description?: string }) =>
      api.post(API_ENDPOINTS.gameSeries, data),
    updateSeries: (
      id: string,
      data: Partial<{ title: string; description: string }>
    ) => api.patch(API_ENDPOINTS.gameSeries, id, data),
  };
};
