import { useRuntimeConfig } from "nuxt/app";

export interface ApiResponse<T = any> {
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
  };
  status?: number;
}

export const useApi = () => {
  const config = useRuntimeConfig();
  const baseApi = config.public.apiBaseUrl;

  const get = async <T>(
    endpoint: string,
    options?: any,
  ): Promise<ApiResponse<T>> => {
    try {
      const res: { data: any; meta: any } = await $fetch(baseApi + endpoint, {
        method: "GET",
        ...options,
      });

      return {
        data: res.data,
        meta: res.meta,
        status: 200,
      };
    } catch (e) {
      throw "Неправильный запрос";
    }
  };

  const getOne = async <T>(
    endpoint: string,
    slug: string,
    options: any,
  ): Promise<ApiResponse<T>> => {
    try {
      const res: any = await $fetch(baseApi + endpoint + slug, {
        method: "GET",
        ...options,
      });
      return {
        data: res,
        status: 200,
      };
    } catch (e) {
      throw e;
    }
  };

  return {
    get,
    getOne,
  };
};
