import { useApi } from '~~/services/api';
import type { User } from '~~/services/types/user.type';

export interface AuthResponse {
  access_token: string;
  user: User;
}

export const useAuth = () => {
  const api = useApi();
  const user = useCookie<User | null>('user_data');
  const isAuthenticated = useState<boolean>('isAuthenticated', () => false);
  // Один раз за загрузку приложения спрашиваем бэкенд, кто мы (кука access_token
  // теперь httpOnly и из JS недоступна). Дальше опираемся на закэшированный флаг.
  const authChecked = useState<boolean>('authChecked', () => false);

  const setAuth = (authData: AuthResponse) => {
    user.value = authData.user;
    isAuthenticated.value = true;
    authChecked.value = true;
  };

  const clearAuth = async () => {
    try {
      await api.logout();
    } catch {
      // бэкенд мог уже инвалидировать сессию — не мешает локальной очистке
    }
    user.value = null;
    isAuthenticated.value = false;
    authChecked.value = true;
  };

  const checkAuth = async (force = false): Promise<boolean> => {
    if (authChecked.value && !force) {
      return isAuthenticated.value;
    }

    try {
      user.value = await api.me();
      isAuthenticated.value = true;
    } catch {
      user.value = null;
      isAuthenticated.value = false;
    }

    authChecked.value = true;
    return isAuthenticated.value;
  };

  const login = async (
    username: string,
    password: string
  ): Promise<AuthResponse | Error> => {
    try {
      const response = await api.login({
        username: username,
        password: password,
      });

      setAuth(response);

      return response;
    } catch {
      return new Error('');
    }
  };

  return {
    login,
    checkAuth,
    clearAuth,
    isAuthenticated,
  };
};
