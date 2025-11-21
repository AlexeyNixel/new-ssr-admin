import { useRuntimeConfig } from 'nuxt/app';
import type { AuthResponse } from '~/composables/useAuth';

export interface ApiResponse<T = any> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
  status?: number;
}

export const useApi = () => {
  const config = useRuntimeConfig();
  const baseApi = config.public.apiBaseUrl;

  const get = async <T>(
    endpoint: string,
    options?: any
  ): Promise<ApiResponse<T>> => {
    try {
      const res: { data: any; meta: any } = await $fetch(baseApi + endpoint, {
        method: 'GET',
        credentials: 'include',
        ...options,
      });

      return {
        data: res.data,
        meta: res.meta,
        status: 200,
      };
    } catch {
      throw 'Неправильный запрос';
    }
  };

  const getWithoutPagination = async <T>(enpoint: string): Promise<T> => {
    return await $fetch(baseApi + enpoint, {
      method: 'GET',
    });
  };

  const post = async (endpoint: string, data: any) => {
    return await $fetch(baseApi + endpoint, {
      method: 'POST',
      credentials: 'include',
      body: { ...data },
    });
  };

  const patch = async (endpoint: string, id: string, data: any) => {
    const res = await $fetch(baseApi + endpoint + id, {
      method: 'PATCH',
      credentials: 'include',
      body: {
        ...data,
      },
    });
    return res.data;
  };

  const login = async (user: {
    username: string;
    password: string;
  }): Promise<AuthResponse> => {
    try {
      return await $fetch(baseApi + '/api/auth/login', {
        method: 'POST',
        body: {
          ...user,
        },
      });
    } catch {
      throw new Error();
    }
  };

  const getOne = async <T>(
    endpoint: string,
    slug: string,
    options: any
  ): Promise<ApiResponse<T>> => {
    try {
      const res: any = await $fetch(baseApi + endpoint + slug, {
        method: 'GET',
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
    getWithoutPagination,
    getOne,
    login,
    post,
    patch,
  };
};
