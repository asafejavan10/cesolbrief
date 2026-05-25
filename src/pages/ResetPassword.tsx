import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Logo } from '../components/Logo';
import { updatePassword } from '../services/dataProvider';

export function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
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
      await updatePassword(email.trim(), senha);
      toast.success('Senha atualizada. Faça login para continuar.');
      navigate('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível redefinir a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-stone-50 px-4 py-8">
      <section className="w-full max-w-md">
        <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-cesol-800">
          <ArrowLeft size={17} /> Voltar para login
        </Link>
        <div className="mb-8">
          <Logo />
        </div>
        <div className="panel p-6 sm:p-8">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cesol-100 text-cesol-800">
            <KeyRound size={24} />
          </div>
          <h1 className="mt-5 text-2xl font-black text-stone-950">Nova senha</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">Digite uma nova senha para sua conta.</p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-stone-700">E-mail</span>
              <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Obrigatório apenas no modo local" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-stone-700">Nova senha</span>
              <input className="input" type="password" value={senha} onChange={(event) => setSenha(event.target.value)} placeholder="Mínimo de 6 caracteres" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-stone-700">Confirmar senha</span>
              <input className="input" type="password" value={confirmarSenha} onChange={(event) => setConfirmarSenha(event.target.value)} placeholder="Repita a senha" />
            </label>
            <button className="btn-primary w-full" disabled={loading} type="submit">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
              Atualizar senha
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
