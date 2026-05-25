import { BarChart3, Home, LogOut, PauseCircle, UserCog, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

const items = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/dashboard/usuarios', label: 'Usuários', icon: UserCog },
  { to: '/briefing', label: 'Novo briefing', icon: Users },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="hidden min-h-screen w-72 border-r border-stone-200 bg-white px-5 py-6 lg:flex lg:flex-col">
      <Logo />
      <nav className="mt-8 flex flex-1 flex-col gap-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn('flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition', isActive ? 'bg-cesol-50 text-cesol-800' : 'text-stone-600 hover:bg-stone-100')
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
        <div>
          <p className="text-sm font-bold text-stone-900">{user?.nome}</p>
          <p className="text-xs text-stone-500">{user?.isAdmin ? 'Administrador' : 'Usuário comum'}</p>
        </div>
        <button aria-label="Sair" onClick={logout} className="rounded-xl p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900" type="button">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
