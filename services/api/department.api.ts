import { useApi } from './index';
import { API_ENDPOINTS } from '../endpoints';
import type {
  Department,
  DepartmentResponse,
} from '~~/services/types/department.type';

export const useDepartmentApi = () => {
  const api = useApi();

  return {
    getAllDepartments: (params?: any) =>
      api.get<Department[]>(API_ENDPOINTS.department, { params: params }),

    createDepartment: (data: any) => api.post(API_ENDPOINTS.department, data),
    updateDepartment: (id: string, data: any) =>
      api.patch(API_ENDPOINTS.department, id, data),
  };
};
