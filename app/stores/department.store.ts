import { useDepartmentApi } from '~~/services/api/department.api';
import type { Department } from '~~/services/types/department.type';
import type { ApiResponse } from '~~/services/api';

export const useDepartmentStore = defineStore('department', () => {
  const departmentApi = useDepartmentApi();

  const departments = ref<ApiResponse<Department[]>>();

  const getDepartments = async (params?: any) => {
    departments.value = await departmentApi.getAllDepartments(params);
  };

  const updateDepartments = async (id: string, data: any) => {
    await departmentApi.updateDepartment(id, data);
  };

  return {
    departments,
    getDepartments,
    updateDepartments,
  };
});
