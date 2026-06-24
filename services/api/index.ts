import { useRuntimeConfig } from 'nuxt/app';
import type { AuthResponse } from '~/composables/useAuth';
import type { File } from '~~/services/types/file.type';
import type { IQuery } from '~~/services/types/query.type';

export interface ApiResponse<T = unknown> {
  data: T;
  meta?: Meta;
  status?: number;
}

export interface Meta {
  page: number;
  limit: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export const useApi = () => {
  const config = useRuntimeConfig();
  const baseApi = config.public.apiBaseUrl;

  const get = async <T>(
    endpoint: string,
    options?: {
      params?: IQuery;
    }
  ): Promise<ApiResponse<T>> => {
    try {
      const res: { data: T; meta: Meta } = await $fetch(baseApi + endpoint, {
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

  const getWithoutPagination = async <T>(
    endpoint: string,
    options?: IQuery
  ): Promise<T> => {
    return await $fetch(baseApi + endpoint, {
      method: 'GET',
      credentials: 'include',
      ...options,
    });
  };

  const post = async <T extends object>(endpoint: string, data: T): Promise<unknown> => {
    return await $fetch<unknown>(baseApi + endpoint, {
      method: 'POST',
      credentials: 'include',
      body: data,
    });
  };

  const postFile = async (endpoint: string, body: FormData): Promise<File> => {
    console.log(baseApi);
    return await $fetch<File>(baseApi + endpoint, {
      method: 'POST',
      credentials: 'include',
      body,
    });
  };

  const postMany = async <T extends object>(endpoint: string, data: T[]): Promise<unknown> => {
    return await $fetch<unknown>(baseApi + endpoint, {
      method: 'POST',
      credentials: 'include',
      body: { data },
    });
  };

  const patch = async <T extends object>(endpoint: string, id: string, data: T): Promise<unknown> => {
    const res = await $fetch<{ data: unknown }>(baseApi + endpoint + id, {
      method: 'PATCH',
      credentials: 'include',
      body: data,
    });
    return res.data;
  };

  const login = async (user: {
    username: string;
    password: string;
  }): Promise<AuthResponse> => {
    try {
      const data = await $fetch(baseApi + '/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        body: {
          ...user,
        },
      });
      return data;
    } catch {
      throw new Error();
    }
  };

  const getOne = async <T>(
    endpoint: string,
    slug: string,
    options?: { params?: IQuery }
  ): Promise<ApiResponse<T>> => {
    const res = await $fetch<T>(baseApi + endpoint + slug, {
      method: 'GET',
      ...options,
    });
    return {
      data: res,
      status: 200,
    };
  };

  return {
    get,
    getWithoutPagination,
    getOne,
    login,
    post,
    postMany,
    postFile,
    patch,
  };
};
