import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { setUnauthorizedHandler } from '../../../services/api/apiClient';
import * as authApi from '../../../services/api/authApi';
import { clearAccessToken, getAccessToken, saveAccessToken } from '../../../services/authTokenStorage';
import type { User } from '../../../types/api';

type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('bootstrapping');
  const updateUser = useCallback((updatedUser: User) => {
    setUser((current) => current?.id === updatedUser.id ? updatedUser : current);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      const token = await getAccessToken();

      if (!token) {
        if (isMounted) {
          setStatus('unauthenticated');
        }
        return;
      }

      try {
        const result = await authApi.me();

        if (isMounted) {
          setUser(result.user);
          setStatus('authenticated');
        }
      } catch {
        await clearAccessToken();

        if (isMounted) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus('unauthenticated');
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  async function login(email: string, password: string) {
    const authResponse = await authApi.login({ email, password });
    const accessToken = authResponse.tokens?.accessToken;

    if (!accessToken) {
      throw new Error('Сервер не вернул accessToken');
    }

    await saveAccessToken(accessToken);
    const meResponse = await authApi.me();

    setUser(meResponse.user);
    setStatus('authenticated');
  }

  async function register(name: string, email: string, password: string) {
    const authResponse = await authApi.register({ name, email, password });
    const accessToken = authResponse.tokens?.accessToken;

    if (accessToken) {
      await saveAccessToken(accessToken);
      const meResponse = await authApi.me();

      setUser(meResponse.user);
      setStatus('authenticated');
      return;
    }

    await login(email, password);
  }

  async function logout() {
    await clearAccessToken();
    setUser(null);
    setStatus('unauthenticated');
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isBootstrapping: status === 'bootstrapping',
      login,
      register,
      logout,
      updateUser,
    }),
    [status, user, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}
