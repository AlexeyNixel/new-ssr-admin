import { useDepartmentApi } from '~~/services/api/department.api';
import type { Department } from '~~/services/types/department.type';
import type { ApiResponse } from '~~/services/api';
import type { IQuery } from '~~/services/types/query.type';

export const useDepartmentStore = defineStore('department', () => {
  const departmentApi = useDepartmentApi();

  const departments = ref<ApiResponse<Department[]>>();

  const getDepartments = async (params?: IQuery) => {
    departments.value = await departmentApi.getAllDepartments(params);
  };

  const updateDepartments = async (id: string, data: Partial<Department>) => {
    await departmentApi.updateDepartment(id, data);
  };

  return {
    departments,
    getDepartments,
    updateDepartments,
  };
});
