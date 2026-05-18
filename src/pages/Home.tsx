import { ArrowRight, CheckCircle2, ClipboardList, LockKeyhole, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';

const cards = [
  { icon: ClipboardList, title: 'Briefings guiados', text: 'Coleta padronizada para reduzir retrabalho e deixar a demanda clara desde o início.' },
  { icon: SlidersHorizontal, title: 'Gestão de status', text: 'Acompanhamento visual por técnico, serviço, cidade, situação e prioridade operacional.' },
  { icon: LockKeyhole, title: 'Acesso seguro', text: 'Perfis de usuário e administrador para separar criação, acompanhamento e controle interno.' },
];

export function Home() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fff7e7_0%,#ffffff_72%)]">
        <div className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cesol-200 bg-white px-3 py-1 text-xs font-bold text-cesol-800 shadow-sm">
              <Sparkles size={14} /> Sistema CESOL para demandas criativas
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight text-stone-950 sm:text-5xl lg:text-6xl">CesolBrief</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">
              Centralize solicitações de design e comunicação em briefings completos, rastreáveis e fáceis de priorizar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/briefing" className="btn-primary">
                Criar briefing <ArrowRight size={18} />
              </Link>
              <Link to={user ? '/dashboard' : '/login'} className="btn-secondary">
                {user ? 'Abrir dashboard' : 'Entrar no sistema'}
              </Link>
            </div>
            <div className="mt-8 grid gap-3 text-sm font-semibold text-stone-600 sm:grid-cols-3">
              {['Multi-step', 'Upload de anexos', 'Dashboard SaaS'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="text-cesol-700" size={17} /> {item}
                </div>
              ))}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="panel overflow-hidden p-4 sm:p-6">
            <div className="rounded-2xl bg-stone-950 p-4 text-white">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-amber-200">Painel administrativo</span>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">Online</span>
              </div>
              <div className="mt-6 grid gap-3">
                {['Sabores da Serra', 'Ateliê Flor do Sertão', 'Coop Vale Verde'].map((name, index) => (
                  <div key={name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold">{name}</p>
                        <p className="mt-1 text-xs text-stone-300">{index === 0 ? 'Logotipo' : index === 1 ? 'Rede Social' : 'Rotulagem'}</p>
                      </div>
                      <span className="rounded-full bg-amber-300/15 px-3 py-1 text-xs font-bold text-amber-100">{index === 2 ? 'concluido' : 'novo'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="panel p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cesol-100 text-cesol-800">
                <card.icon size={22} />
              </div>
              <h2 className="mt-5 text-xl font-black text-stone-950">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">{card.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
