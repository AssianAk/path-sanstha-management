import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  roleName: string;
  branchId?: string | null;
  branchName?: string;
  branchCode?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  businessDate: string;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  quickSwitch: (username: string, password: string) => Promise<void>;
  setBusinessDate: (date: string) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('coop_token'));
  const [businessDate, setBusinessDate] = useState<string>('2026-09-11');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            setBusinessDate(res.data.businessDate || '2026-09-11');
          }
        } catch (e) {
          console.error('Failed to verify stored token');
          localStorage.removeItem('coop_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.success) {
      localStorage.setItem('coop_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setBusinessDate(res.data.businessDate || '2026-09-11');
    }
  };

  const quickSwitch = async (username: string, password: string) => {
    await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('coop_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        businessDate,
        token,
        login,
        logout,
        quickSwitch,
        setBusinessDate,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
