import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { getCurrentUser, setCurrentUser, login as storeLogin, register as storeRegister, logout as storeLogout } from '@/lib/store';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => string | true;
  register: (email: string, name: string, password: string) => string | true;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getCurrentUser());

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const login = (email: string, password: string): string | true => {
    const result = storeLogin(email, password);
    if (typeof result === 'string') return result;
    setUser(result);
    setCurrentUser(result);
    return true;
  };

  const register = (email: string, name: string, password: string): string | true => {
    const result = storeRegister(email, name, password);
    if (typeof result === 'string') return result;
    setUser(result);
    setCurrentUser(result);
    return true;
  };

  const logout = () => {
    storeLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
