import { CheckCircle2, LayoutDashboard, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

export function Success() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="grid min-h-[calc(100vh-73px)] place-items-center px-4">
        <div className="panel max-w-xl p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="mt-6 text-3xl font-black text-stone-950">Briefing enviado</h1>
          <p className="mt-3 text-stone-600">Sua solicitação foi registrada com status inicial novo e já está disponível para acompanhamento administrativo.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/briefing" className="btn-secondary"><Plus size={18} /> Criar outro</Link>
            {user?.isAdmin && <Link to="/dashboard" className="btn-primary"><LayoutDashboard size={18} /> Dashboard</Link>}
          </div>
        </div>
      </main>
    </div>
  );
}
