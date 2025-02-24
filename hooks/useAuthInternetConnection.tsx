import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import api from '../config/axios';

const HEALTH_CHECK_URL = '/v1/health';
const LOGIN_URL = '/v1/auth/login';
const REFRESH_TOKEN_URL = '/v1/auth/token';

interface AuthContextType {
  isConnected: boolean;
  isServerHealthy: boolean | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  userId: string | null;
  roles: string[];
}

const AuthContext = createContext<AuthContextType>({
  isConnected: false,
  isServerHealthy: null,
  isAuthenticated: false,
  login: async () => false,
  logout: async () => {},
  refreshTokens: async () => false,
  userId: null,
  roles: [],
});

export const useAuthInternetConnection = () => useContext(AuthContext);

export const AuthInternetConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenExpiryTime, setTokenExpiryTime] = useState<number | null>(null);

  let refreshTimeout: NodeJS.Timeout | null = null;

  useEffect(() => {
    const initializeConnection = async () => {
      setIsLoading(true);
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected ?? false);
      setIsServerHealthy(state.isConnected ? null : false);
      if (state.isConnected) checkServerHealth();

      await loadAuthState();
      setIsLoading(false);
    };

    const handleConnectionChange = (state: any) => {
      setIsConnected(state.isConnected ?? false);
    };

    initializeConnection();
    const unsubscribe = NetInfo.addEventListener(handleConnectionChange);

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(checkServerHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setupTokenRefresh(tokenExpiryTime);
    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [tokenExpiryTime]);

  const checkServerHealth = async () => {
    try {
      await api.get(HEALTH_CHECK_URL, { headers: { skipAuth: true } });
      setIsServerHealthy(true);
    } catch {
      setIsServerHealthy(false);
    }
  };

  const loadAuthState = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      setIsAuthenticated(false);
      setUserId(null);
      setRoles([]);
      return;
    }
  
    try {
      const decoded: { sub: string; exp: number; roles: string | string[] } = jwtDecode(token);
      const roles = Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles];
  
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp - 30 <= currentTime) {
        console.log('[Auth] Access token истёк, пробуем обновить...');
        const success = await refreshTokens();
        if (!success) {
          setIsAuthenticated(false);
          setUserId(null);
          setRoles([]);
          return;
        }
      } else {
        setUserId(decoded.sub);
        setRoles(roles);
        setTokenExpiryTime(decoded.exp - 30);
        setIsAuthenticated(true);
      }
      
      console.log('[Auth] Токен загружен, пользователь аутентифицирован.');
    } catch (error) {
      console.error('[Auth] Ошибка декодирования токена:', error);
      setIsAuthenticated(false);
      setUserId(null);
      setRoles([]);
    }
  };
  

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post(LOGIN_URL, { email, password }, { headers: { skipAuth: true } });
      const { accessToken, refreshToken } = response.data;

      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);

      const decoded: { sub: string; exp: number; roles: string | string[] } = jwtDecode(accessToken);
      const roles = Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles];

      setUserId(decoded.sub);
      setRoles(roles);
      setTokenExpiryTime(decoded.exp - 30);
      setIsAuthenticated(true);

      console.log('[Auth] Успешный вход в систему. Access token получен.');
      return true;
    } catch (error) {
      console.error('[Auth] Ошибка входа:', error.response?.data || error.message);
      return false;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');

    setUserId(null);
    setRoles([]);
    setIsAuthenticated(false);
    setTokenExpiryTime(null);

    console.log('[Auth] Пользователь вышел из системы.');
    loadAuthState();
  };

  const refreshTokens = async (): Promise<boolean> => {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.warn('[Auth] Refresh token отсутствует.');
      return false;
    }

    try {
      const response = await api.post(REFRESH_TOKEN_URL, { refreshToken });
      const { accessToken } = response.data;

      if (!accessToken) {
        console.error('[Auth] Ошибка обновления токена: токен отсутствует в ответе.');
        await logout();
        return false;
      }

      await AsyncStorage.setItem('accessToken', accessToken);
      const decoded: { sub: string; exp: number; roles: string[] } = jwtDecode(accessToken);
      setUserId(decoded.sub);
      setRoles(decoded.roles || []);
      setTokenExpiryTime(decoded.exp - 30);

      console.log('[Auth] Access token обновлён.');
      return true;
    } catch (error) {
      console.error('[Auth] Ошибка обновления токена:', error.response?.data || error.message);
      await logout();
      return false;
    }
  };

  const setupTokenRefresh = (exp: number | null) => {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    if (!exp) return;

    const currentTime = Math.floor(Date.now() / 1000);
    const timeToExpiry = exp - currentTime;

    if (timeToExpiry > 0) {
      refreshTimeout = setTimeout(async () => {
        console.warn('[Auth] Access token истекает, обновляем...');
        const success = await refreshTokens();
        if (success) {
          const newToken = await AsyncStorage.getItem('accessToken');
          if (newToken) {
            const newDecoded: { sub: string; exp: number; roles: string[] } = jwtDecode(newToken);
            setRoles(newDecoded.roles || []);
            setTokenExpiryTime(newDecoded.exp - 30);
            setupTokenRefresh(newDecoded.exp - 30);
          }
        }
      }, timeToExpiry * 1000);
    }
  };

  return (
    <AuthContext.Provider value={{
      isConnected,
      isServerHealthy,
      isAuthenticated,
      login,
      logout,
      refreshTokens,
      userId,
      roles,
    }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
