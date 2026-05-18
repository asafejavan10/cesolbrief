import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-stone-50 text-sm font-semibold text-stone-500">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/briefing" replace />;
  return <Outlet />;
}
