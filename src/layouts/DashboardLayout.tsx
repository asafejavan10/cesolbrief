import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useState } from 'react';
import { BarChart3, Home, LogOut, Menu, X, UserCog, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';
import { Logo } from '../components/Logo';
import { NotificationsButton } from '../components/NotificationsButton';
import { Sidebar } from '../components/Sidebar';

const menuItems = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/dashboard/usuarios', label: 'Usuários', icon: UserCog },
  { to: '/briefing', label: 'Novo briefing', icon: Users },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50 lg:flex animate-in fade-in duration-200">
      {/* Mobile Sticky Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-stone-200/80 bg-white/80 px-4 py-4 backdrop-blur-md lg:hidden">
        <Logo />
        <button
          onClick={() => setMenuOpen(true)}
          className="rounded-xl p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          type="button"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm lg:hidden"
            />

            {/* Side Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col bg-white px-5 py-6 shadow-soft lg:hidden"
            >
              <div className="flex items-center justify-between">
                <Logo />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                  type="button"
                  aria-label="Fechar menu"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="mt-8 flex flex-1 flex-col gap-2">
                {menuItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition',
                        isActive
                          ? 'bg-cesol-50 text-cesol-800'
                          : 'text-stone-600 hover:bg-stone-100'
                      )
                    }
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-4 flex items-center justify-between rounded-2xl border border-stone-200 p-3">
                <div>
                  <p className="text-sm font-bold text-stone-900">{user?.nome}</p>
                  <p className="text-xs text-stone-500">
                    {user?.isAdmin ? 'Administrador' : 'Usuário comum'}
                  </p>
                </div>
                <button
                  aria-label="Sair"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="rounded-xl p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
                  type="button"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="relative min-w-0 flex-1">
        <div className="fixed bottom-4 right-4 z-40 lg:bottom-8 lg:right-8">
          <NotificationsButton />
        </div>
        {children}
      </main>
    </div>
  );
}

