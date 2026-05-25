import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Logo } from '../components/Logo';
import { requestPasswordReset } from '../services/dataProvider';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.includes('@')) {
      toast.error('Informe um e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      toast.success('Enviamos as instruções de recuperação para seu e-mail.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a recuperação.');
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
            <Mail size={24} />
          </div>
          <h1 className="mt-5 text-2xl font-black text-stone-950">Recuperar senha</h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">Informe seu e-mail para receber o link de redefinição de senha.</p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-stone-700">E-mail</span>
              <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@exemplo.com" />
            </label>
            <button className="btn-primary w-full" disabled={loading} type="submit">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
              Enviar recuperação
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
