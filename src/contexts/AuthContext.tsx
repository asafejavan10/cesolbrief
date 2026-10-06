import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { dataProviderName, getUserProfile, login as loginService, logout as logoutService } from '../services/dataProvider';
import { User } from '../types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = `cesolbrief:session:${dataProviderName}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem('cesolbrief:session');
    const session = localStorage.getItem(SESSION_KEY);
    if (session) setUser(JSON.parse(session) as User);
    setLoading(false);
  }, []);

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updates };
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    });
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const refreshed = await getUserProfile(user.id);
      setUser(refreshed);
      localStorage.setItem(SESSION_KEY, JSON.stringify(refreshed));
    } catch (err) {
      console.error('Erro ao atualizar dados do usuário:', err);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, senha) => {
        const authenticated = await loginService(email, senha);
        setUser(authenticated);
        localStorage.setItem(SESSION_KEY, JSON.stringify(authenticated));
        toast.success('Login realizado com sucesso.');
      },
      logout: () => {
        void logoutService();
        setUser(null);
        localStorage.removeItem(SESSION_KEY);
        toast.success('Sessão encerrada.');
      },
      updateUser,
      refreshUser,
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
