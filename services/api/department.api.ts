import { useApi } from './index';
import { API_ENDPOINTS } from '../endpoints';
import type { Department } from '~~/services/types/department.type';
import type { IQuery } from '~~/services/types/query.type';

export const useDepartmentApi = () => {
  const api = useApi();

  return {
    getAllDepartments: (params?: IQuery) =>
      api.get<Department[]>(API_ENDPOINTS.department, { params }),

    createDepartment: (data: Partial<Department>) => api.post(API_ENDPOINTS.department, data),
    updateDepartment: (id: string, data: Partial<Department>) =>
      api.patch(API_ENDPOINTS.department, id, data),
  };
};
