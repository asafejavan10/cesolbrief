import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Logo } from '../components/Logo';
import { register } from '../services/dataProvider';

export function Signup() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (nome.trim().length < 3) {
      toast.error('Informe seu nome completo.');
      return;
    }
    if (!email.includes('@')) {
      toast.error('Informe um e-mail válido.');
      return;
    }
    if (senha.length < 6) {
      toast.error('A senha precisa ter ao menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      toast.error('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      await register(nome.trim(), email.trim(), senha);
      toast.success('Conta criada. Agora faça login para continuar.');
      navigate('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-stone-50 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:p-0">
      <section className="hidden bg-[linear-gradient(135deg,#78350f,#b45309_45%,#f59e0b)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-amber-100">
          <ArrowLeft size={17} /> Voltar
        </Link>
        <div>
          <h1 className="max-w-xl text-5xl font-black leading-tight">Solicite briefings com uma conta individual.</h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-amber-50">Novas contas entram como usuários comuns. Acesso administrativo é liberado separadamente pela gestão.</p>
        </div>
        <p className="text-sm font-semibold text-amber-100">CESOL Design e Comunicação</p>
      </section>
      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <Logo />
        </div>
        <div className="panel p-6 sm:p-8">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cesol-100 text-cesol-800">
            <UserPlus size={24} />
          </div>
          <h1 className="mt-5 text-2xl font-black text-stone-950">Criar conta</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">Cadastro para técnicos solicitarem briefings. Contas novas não recebem permissão de administrador.</p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-stone-700">Nome</span>
              <input className="input" value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Seu nome completo" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-stone-700">E-mail</span>
              <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@exemplo.com" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-stone-700">Senha</span>
              <input className="input" type="password" value={senha} onChange={(event) => setSenha(event.target.value)} placeholder="Mínimo de 6 caracteres" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-stone-700">Confirmar senha</span>
              <input className="input" type="password" value={confirmarSenha} onChange={(event) => setConfirmarSenha(event.target.value)} placeholder="Repita a senha" />
            </label>
            <button className="btn-primary w-full" disabled={loading} type="submit">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
              Criar conta
            </button>
          </form>
          <p className="mt-4 text-sm font-semibold text-stone-500">
            Já tem conta? <Link to="/login" className="text-cesol-800 hover:text-cesol-900">Entrar</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
