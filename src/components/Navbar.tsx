import { ArrowRight, LayoutDashboard, LogOut, Menu } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

export function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const items = [
    { to: '/', label: 'Início' },
    { to: '/briefing', label: 'Novo briefing' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="CesolBrief">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn('rounded-xl px-4 py-2 text-sm font-semibold transition', isActive ? 'bg-cesol-50 text-cesol-800' : 'text-stone-600 hover:bg-stone-100')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to="/dashboard" className="btn-secondary py-2">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <button onClick={logout} className="btn-secondary py-2" type="button">
                <LogOut size={16} /> Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary py-2">
                Login
              </Link>
              <Link to="/briefing" className="btn-primary py-2">
                Criar briefing <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>
        <button className="btn-secondary px-3 py-2 md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Abrir menu" type="button">
          <Menu size={18} />
        </button>
      </div>
      {open && (
        <div className="border-t border-stone-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-100">
                {item.label}
              </Link>
            ))}
            <Link to={user ? '/dashboard' : '/login'} onClick={() => setOpen(false)} className="btn-primary mt-2">
              {user ? 'Dashboard' : 'Entrar'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
