import { Loader2, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.isAdmin) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/briefing', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.includes('@') || senha.length < 6) {
      toast.error('Informe um e-mail válido e senha com ao menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await login(email, senha);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao entrar.');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <div className="grid min-h-screen place-items-center bg-stone-50 text-sm font-semibold text-stone-500">Carregando...</div>;
  }

  return (
    <main className="grid min-h-screen bg-stone-50 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:p-0">
      <section className="hidden bg-[linear-gradient(135deg,#78350f,#b45309_45%,#f59e0b)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div />
        <div>
          <h1 className="max-w-xl text-5xl font-black leading-tight">Produtividade para quem transforma demanda em criação.</h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-amber-50">Acesse o painel, acompanhe solicitações e mantenha o fluxo da equipe organizado.</p>
        </div>
        <p className="text-sm font-semibold text-amber-100">CESOL Design e Comunicação</p>
      </section>
      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <Logo />
        </div>
        <div className="panel p-6 sm:p-8">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cesol-100 text-cesol-800">
            <ShieldCheck size={24} />
          </div>
          <h1 className="mt-5 text-2xl font-black text-stone-950">Entrar no CesolBrief</h1>
          <p className="mt-2 text-sm text-stone-500">Acesse com sua conta cadastrada. Permissões administrativas são liberadas pela gestão.</p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-stone-700">E-mail</span>
              <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@cesol.br" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-stone-700">Senha</span>
              <input className="input" type="password" value={senha} onChange={(event) => setSenha(event.target.value)} placeholder="Sua senha" />
            </label>
            <button className="btn-primary w-full" disabled={loading} type="submit">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
              Entrar
            </button>
          </form>
          <Link to="/recuperar-senha" className="mt-4 inline-flex text-sm font-bold text-cesol-800 hover:text-cesol-900">
            Recuperar senha
          </Link>
          <Link to="/cadastro" className="btn-secondary mt-5 w-full">
            <UserPlus size={18} /> Criar conta
          </Link>
        </div>
      </section>
    </main>
  );
}
