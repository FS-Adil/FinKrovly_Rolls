import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react';
import { api } from '../api/client';
import type { User } from '../api/types';

// ===== DEV BYPASS =====
const BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true';
const MOCK_USER: User = {
  username: 'dev',
  fullName: 'Dev User',
  role: 'ADMIN',
  organization: 'TEST ORG'
};
// ======================

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(BYPASS ? MOCK_USER : null);
  const [loading, setLoading] = useState(!BYPASS);

  useEffect(() => {
    if (BYPASS) {
      setLoading(false);
      setUser(MOCK_USER);
      return;
    }

    let cancelled = false;
    api.me()
      .then(u => { if (!cancelled) setUser(u); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<User> => {
    if (BYPASS) {
      setUser(MOCK_USER);
      return MOCK_USER;
    }
    const u = await api.login(username, password);
    const user: User = {
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      organization: u.organization
    };
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    if (BYPASS) {
      setUser(MOCK_USER);
      return;
    }
    try { await api.logout(); } catch { /* ignore */ }
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}