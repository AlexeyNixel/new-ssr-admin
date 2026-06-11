import { useApi } from './index';
import type { Club, ClubParams } from '../types/club.type';
import { API_ENDPOINTS } from '../endpoints';

export const useClubApi = () => {
  const api = useApi()

  return {
    getAllClubs: (params: ClubParams) =>
      api.get<Club[]>(API_ENDPOINTS.clubs, { params: params }),
  };
}