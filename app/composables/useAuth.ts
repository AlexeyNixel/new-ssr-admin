import { jwtDecode } from 'jwt-decode';
import { useApi } from '~~/services/api';
import type { User } from '~~/services/types/user.type';

export interface AuthResponse {
  access_token: string;
  user: User;
}

interface TokenPayload {
  username: string;
  sub: number;
  name: string;
  iat: number;
  exp: number;
}

export const useAuth = () => {
  const api = useApi();
  const token = useCookie('access_token');
  const user = useCookie<User | null>('user_data');
  const isAuthenticated = useState<boolean>('isAuthenticated', () => false);

  const setAuth = (authData: AuthResponse) => {
    token.value = authData.access_token;
    user.value = authData.user;
    isAuthenticated.value = true;
  };

  const clearAuth = () => {
    token.value = '';
    user.value = null;
    isAuthenticated.value = false;
  };

  const isTokenValid = (): boolean => {
    if (!token.value) {
      return false;
    }

    try {
      const payload = jwtDecode<TokenPayload>(token.value);
      const currentTime = Math.floor(Date.now() / 1000);

      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  };

  const checkAuth = () => {
    const valid = isTokenValid();
    isAuthenticated.value = valid;

    if (!valid) {
      clearAuth();
    }

    return valid;
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

  checkAuth();

  return {
    isTokenValid,
    login,
    checkAuth,
    clearAuth,
    isAuthenticated,
  };
};
