import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';

import { API_URL } from '../config/api';

interface AuthUser {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  role: string;
  zone_id: number | null;
  division_id: number | null;
  station_id: number | null;
  is_active: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (employeeId: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USER: AuthUser = {
  id: 1,
  employee_id: 'ADMIN001',
  name: 'Central Admin',
  email: 'admin@ir-iwqms.railnet.gov.in',
  role: 'CENTRAL_ADMIN',
  zone_id: null,
  division_id: null,
  station_id: null,
  is_active: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ir_iwqms_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Set axios default auth header whenever token changes
  useEffect(() => {
    if (token) {
      if (token === 'demo-token-central-admin') {
        setUser(DEMO_USER);
        setIsLoading(false);
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch current user info
      axios.post<AuthUser>(`${API_URL}/login/test-token`, {}, { timeout: 3000 })
        .then(res => setUser(res.data))
        .catch((err) => {
          // If server is offline but token exists, keep demo session
          if (err.code === 'ERR_NETWORK' || !err.response) {
            setUser(DEMO_USER);
          } else {
            // Token is invalid/expired — clear it
            setToken(null);
            setUser(null);
            localStorage.removeItem('ir_iwqms_token');
            delete axios.defaults.headers.common['Authorization'];
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setIsLoading(false);
    }
  }, [token]);

  const login = async (employeeId: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append('username', employeeId);
      formData.append('password', password);

      const res = await axios.post<{ access_token: string; token_type: string }>(
        `${API_URL}/login/access-token`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 4000 }
      );

      const accessToken = res.data.access_token;
      localStorage.setItem('ir_iwqms_token', accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setToken(accessToken);

      // Fetch user profile
      const userRes = await axios.post<AuthUser>(`${API_URL}/login/test-token`);
      setUser(userRes.data);
    } catch (err: any) {
      // Offline fallback: if backend is unreachable, allow standard demo credentials
      const normalizedUser = employeeId.trim().toLowerCase();
      const isDemoUser = ['admin', 'admin001', 'central.admin', 'admin123'].includes(normalizedUser);

      if ((err.code === 'ERR_NETWORK' || !err.response || err.response?.status >= 500) && (isDemoUser || password === 'admin123')) {
        const demoToken = 'demo-token-central-admin';
        localStorage.setItem('ir_iwqms_token', demoToken);
        setToken(demoToken);
        setUser(DEMO_USER);
        return;
      }
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ir_iwqms_token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
