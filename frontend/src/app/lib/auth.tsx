import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, User } from './api';

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = 'cfms_token';
const USER_KEY = 'cfms_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!token) return;
        const me = await api.auth.me();
        if (cancelled) return;
        setUser(me.user);
        localStorage.setItem(USER_KEY, JSON.stringify(me.user));
      } catch {
        if (cancelled) return;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    if (!token) setIsLoading(false);
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      isLoading,
      login: async (email, password) => {
        const res = await api.auth.login(email, password);
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        setToken(res.token);
        setUser(res.user);
        return res.user;
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      },
      refreshUser: async () => {
        const t = localStorage.getItem(TOKEN_KEY);
        if (!t) return;
        const me = await api.auth.me();
        setUser(me.user);
        localStorage.setItem(USER_KEY, JSON.stringify(me.user));
      },
    }),
    [isLoading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: 'admin' | 'staff';
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) {
    window.location.href = '/login';
    return null;
  }
  if (role && user.role !== role) {
    window.location.href = user.role === 'admin' ? '/admin' : '/staff';
    return null;
  }
  return <>{children}</>;
}

