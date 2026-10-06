import { BarChart3, History, Home, LogOut, PauseCircle, UserCog, Users, User } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { Logo } from './Logo';
import { UserAvatar } from './UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

const items = [
  { to: '/dashboard', label: 'Home', icon: Home, adminOnly: false },
  { to: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart3, adminOnly: true },
  { to: '/dashboard/usuarios', label: 'Usuários', icon: UserCog, adminOnly: true },
  { to: '/dashboard/perfil', label: 'Meu Perfil', icon: User, adminOnly: false },
  { to: '/briefing', label: 'Novo briefing', icon: Users, adminOnly: false },
  { to: '/dashboard/historico', label: 'Histórico de Trimestres', icon: History, adminOnly: true },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const visibleItems = items.filter((item) => !item.adminOnly || user?.isAdmin);

  return (
    <aside className="hidden min-h-screen w-72 border-r border-stone-200 bg-white px-5 py-6 lg:flex lg:flex-col">
      <Logo />
      <nav className="mt-8 flex flex-1 flex-col gap-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition',
                isActive ? 'bg-cesol-50 text-cesol-800' : 'text-stone-600 hover:bg-stone-100'
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="rounded-2xl border border-cesol-100 bg-cesol-50 p-4 text-sm text-cesol-900">
        <div className="mb-2 flex items-center gap-2 font-bold">
          <PauseCircle size={16} /> Controle admin
        </div>
        <p className="text-xs leading-5 text-cesol-800">Pausar ou reativar recebimentos está disponível no dashboard.</p>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-stone-200 p-3">
        <Link to="/dashboard/perfil" className="flex items-center gap-3 min-w-0 hover:opacity-80 transition">
          <UserAvatar
            src={user?.avatar_url}
            name={user?.nome || ''}
            size="sm"
            showBorder={true}
            className="border border-stone-800"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-950 truncate">{user?.nome}</p>
            <p className="text-xs text-stone-500 truncate">{user?.isAdmin ? 'Administrador' : 'Técnico'}</p>
          </div>
        </Link>
        <button
          aria-label="Sair"
          onClick={logout}
          className="rounded-xl p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 shrink-0"
          type="button"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
