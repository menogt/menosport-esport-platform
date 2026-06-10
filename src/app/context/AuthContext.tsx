import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'player' | 'captain' | 'organizer' | 'admin' | 'sponsor';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  teamId?: string;
  avatar: string;
  region: string;
  game: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  game: string;
  region: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'arenax_user';

// Prebuilt mock accounts for demo
const MOCK_ACCOUNTS: Record<string, AuthUser> = {
  'player@demo.com': { id: 'p1', username: 'ShadowFang', email: 'player@demo.com', role: 'player', teamId: 't1', avatar: 'SF', region: 'SEA', game: 'Mobile Legends: Bang Bang' },
  'captain@demo.com': { id: 'p6', username: 'FrostBite', email: 'captain@demo.com', role: 'captain', teamId: 't2', avatar: 'FB', region: 'EU', game: 'Valorant' },
  'organizer@demo.com': { id: 'org1', username: 'ProCircuit', email: 'organizer@demo.com', role: 'organizer', avatar: 'PC', region: 'SEA', game: 'Mobile Legends: Bang Bang' },
  'admin@demo.com': { id: 'adm1', username: 'ArenaAdmin', email: 'admin@demo.com', role: 'admin', avatar: 'AA', region: 'Global', game: 'All' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  }, []);

  const login = async (email: string, _password: string) => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

    // Check mock accounts or create a generic user
    const mockUser = MOCK_ACCOUNTS[email.toLowerCase()];
    const authedUser: AuthUser = mockUser ?? {
      id: `user_${Date.now()}`,
      username: email.split('@')[0],
      email,
      role: 'player',
      avatar: email.slice(0, 2).toUpperCase(),
      region: 'SEA',
      game: 'Mobile Legends: Bang Bang',
    };

    setUser(authedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authedUser));
  };

  const register = async (data: RegisterData) => {
    await new Promise(r => setTimeout(r, 800));

    const newUser: AuthUser = {
      id: `user_${Date.now()}`,
      username: data.username,
      email: data.email,
      role: data.role,
      avatar: data.username.slice(0, 2).toUpperCase(),
      region: data.region,
      game: data.game,
    };

    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext) as AuthContextType | null;
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
