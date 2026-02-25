import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api/client';

interface User { id: string; email: string; name: string; role: string; client_id?: string; avatar_url?: string; }
interface Client { id: string; name: string; slug: string; branding: string; product_lines: string; modules: string; }
interface AuthCtx { user: User | null; client: Client | null; login: (email: string, password: string) => Promise<void>; logout: () => void; loading: boolean; }

const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me').then(data => { setUser(data.user); setClient(data.client); }).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setClient(data.client);
  };

  const logout = () => { localStorage.removeItem('token'); setUser(null); setClient(null); };

  return <AuthContext.Provider value={{ user, client, login, logout, loading }}>{children}</AuthContext.Provider>;
}
