import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, PauseCircle, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FileUpload } from '../components/FileUpload';
import { Navbar } from '../components/Navbar';
import { ProgressBar } from '../components/ProgressBar';
import { useAuth } from '../contexts/AuthContext';
import { createBriefing, getSettings, getUserProfile, getBriefings } from '../services/dataProvider';
import { BriefingDraft, ServiceName, ServiceType } from '../types';
import { cn } from '../utils/cn';

const DRAFT_KEY = 'cesolbrief:draft';
const agentes = ['Wendel', 'Deive', 'Andiara', 'Débora', 'Lusimere'];
const servicos: ServiceName[] = ['Rotulagem', 'Logotipo', 'Rede Social', 'Outro'];
const initialDraft: BriefingDraft = {
  agente: '',
  tipo_servico: 'CRIAÇÃO',
  servico: 'Rotulagem',
  servico_outro: '',
  empreendimento: '',
  cidade: '',
  descricao: '',
};

export function BriefingForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<BriefingDraft>(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved ? { ...initialDraft, ...JSON.parse(saved) } : initialDraft;
  });
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [limitError, setLimitError] = useState<string | null>(null);
  const total = 7;
  const progress = ((step + 1) / total) * 100;

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    getSettings().then((settings) => setPaused(settings.briefingsPaused && !user?.isAdmin)).catch(() => setPaused(false));
  }, [user?.isAdmin]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    
    async function checkUserLimit() {
      try {
        const profile = await getUserProfile(userId);
        if (profile.isBlocked) {
          setLimitError('Sua conta está bloqueada pelo administrador. Não é possível enviar novos briefings.');
          return;
        }
        if (profile.limitBriefings !== undefined && profile.limitBriefings !== null) {
          const briefings = await getBriefings(profile);
          if (briefings.length >= profile.limitBriefings) {
            setLimitError(`Você atingiu o limite máximo de ${profile.limitBriefings} briefing(s) permitidos para sua conta.`);
            return;
          }
        }
      } catch (err) {
        console.error('Erro ao verificar limite do usuário:', err);
      } finally {
        setCheckingLimit(false);
      }
    }
    
    checkUserLimit();
  }, [user]);

  const title = useMemo(() => ['Nome do Técnico', 'Tipo de Serviço', 'Serviço Específico', 'Nome do Empreendimento', 'Cidade', 'Descrição detalhada da demanda', 'Anexos'][step], [step]);

  function validate() {
    if (step === 0 && !draft.agente) return 'Selecione o técnico responsável.';
    if (step === 2 && draft.servico === 'Outro' && !draft.servico_outro?.trim()) return 'Especifique o serviço.';
    if (step === 3 && draft.empreendimento.trim().length < 2) return 'Informe o nome do empreendimento.';
    if (step === 4 && draft.cidade.trim().length < 2) return 'Informe a cidade.';
    if (step === 5 && draft.descricao.trim().length < 10) return 'A descrição precisa ter no mínimo 10 caracteres.';
    return null;
  }

  function next() {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setStep((value) => Math.min(total - 1, value + 1));
  }

  async function submit() {
    if (!user) return;
    if (paused) {
      toast.error('O recebimento de briefings está pausado no momento.');
      return;
    }
    setSubmitting(true);
    try {
      await createBriefing(draft, files, user);
      toast.success('Briefing enviado com sucesso.');
      navigate('/sucesso');
    } catch {
      toast.error('Não foi possível enviar o briefing.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-sm font-bold text-stone-500">Etapa {step + 1} de {total}</p>
            <div className="flex items-center gap-2 text-xs font-bold text-cesol-800">
              <Save size={14} /> Salvamento local ativo
            </div>
          </div>
          <ProgressBar value={progress} />
        </div>
        {paused && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            <PauseCircle size={20} /> O recebimento de novos briefings está pausado temporariamente.
          </div>
        )}
        <section className="panel flex flex-1 flex-col justify-center p-5 sm:p-8 lg:p-10">
          {checkingLimit ? (
            <div className="flex flex-col items-center justify-center py-12 text-stone-500">
              <Loader2 className="animate-spin text-cesol-600 mb-3" size={32} />
              <p className="text-sm font-semibold">Verificando permissões de acesso...</p>
            </div>
          ) : limitError ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">
                <PauseCircle size={28} />
              </div>
              <h2 className="text-2xl font-black text-stone-950">Acesso Restrito</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
                {limitError}
              </p>
              <button
                onClick={() => navigate('/briefing')}
                className="btn-primary mt-6"
                type="button"
              >
                Voltar aos Briefings
              </button>
            </div>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.24 }}>
                  <h1 className="text-3xl font-black text-stone-950 sm:text-4xl">{title}</h1>
                  <div className="mt-8">
                    {step === 0 && <OptionGrid items={agentes} value={draft.agente} onChange={(agente) => setDraft({ ...draft, agente })} />}
                    {step === 1 && <OptionGrid items={['CRIAÇÃO', 'MELHORIA']} value={draft.tipo_servico} onChange={(tipo_servico) => setDraft({ ...draft, tipo_servico: tipo_servico as ServiceType })} />}
                    {step === 2 && (
                      <div className="space-y-5">
                        <OptionGrid items={servicos} value={draft.servico} onChange={(servico) => setDraft({ ...draft, servico: servico as ServiceName })} />
                        {draft.servico === 'Outro' && <input className="input" value={draft.servico_outro} onChange={(event) => setDraft({ ...draft, servico_outro: event.target.value })} placeholder="Especifique o serviço" />}
                      </div>
                    )}
                    {step === 3 && <input className="input text-lg" value={draft.empreendimento} onChange={(event) => setDraft({ ...draft, empreendimento: event.target.value })} placeholder="Ex.: Sabores da Serra" />}
                    {step === 4 && <input className="input text-lg" value={draft.cidade} onChange={(event) => setDraft({ ...draft, cidade: event.target.value })} placeholder="Ex.: Jacobina" />}
                    {step === 5 && (
                      <div>
                        <textarea className="input min-h-56 resize-none text-base leading-7" value={draft.descricao} onChange={(event) => setDraft({ ...draft, descricao: event.target.value })} placeholder="Descreva objetivo, público, referências, prazos e observações importantes." />
                        <p className={cn('mt-2 text-right text-sm font-semibold', draft.descricao.length < 10 ? 'text-red-500' : 'text-emerald-600')}>{draft.descricao.length} caracteres</p>
                      </div>
                    )}
                    {step === 6 && <FileUpload files={files} onChange={setFiles} />}
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button className="btn-secondary" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0 || submitting} type="button">
                  <ArrowLeft size={18} /> Anterior
                </button>
                {step < total - 1 ? (
                  <button className="btn-primary" onClick={next} type="button">
                    Próxima <ArrowRight size={18} />
                  </button>
                ) : (
                  <button className="btn-primary" disabled={submitting || paused} onClick={submit} type="button">
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                    Finalizar briefing
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function OptionGrid({ items, value, onChange }: { items: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <button
          key={item}
          className={cn('rounded-2xl border p-5 text-left text-lg font-black transition', value === item ? 'border-cesol-500 bg-cesol-50 text-cesol-900 shadow-card' : 'border-stone-200 bg-white text-stone-700 hover:border-cesol-200 hover:bg-cesol-50/60')}
          onClick={() => onChange(item)}
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
