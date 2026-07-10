import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  PauseCircle,
  PlusCircle,
  FolderOpen,
  Calendar,
  MapPin,
  ClipboardList,
  Clock3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Download,
  Edit3,
  Trash2
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmModal } from '../components/ConfirmModal';
import { FileUpload } from '../components/FileUpload';
import { Navbar } from '../components/Navbar';
import { ProgressBar } from '../components/ProgressBar';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { createBriefing, getSettings, getUserProfile, getBriefings, deleteBriefing, updateBriefing } from '../services/dataProvider';
import { Briefing, BriefingDraft, ServiceName, ServiceType } from '../types';
import { cn } from '../utils/cn';
import { formatBytes, formatDate } from '../utils/format';

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
  const [viewMode, setViewMode] = useState<'portal' | 'create' | 'list'>('portal');
  const [briefingsList, setBriefingsList] = useState<Briefing[]>([]);
  const [expandedBriefingId, setExpandedBriefingId] = useState<string | null>(null);
  const [activeQuarter, setActiveQuarter] = useState(8);
  const [filterTrimestre, setFilterTrimestre] = useState('todos');

  // Form states
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<BriefingDraft>(initialDraft);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [editingBriefing, setEditingBriefing] = useState<Briefing | null>(null);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const total = 6;
  const progress = ((step + 1) / total) * 100;

  // Load user briefings & settings on mount
  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function loadInitialData() {
      try {
        const settings = await getSettings();
        setPaused(settings.briefingsPaused && !currentUser.isAdmin);
        setActiveQuarter(settings.activeQuarter);

        const list = await getBriefings(currentUser);
        setBriefingsList(list);

        const profile = await getUserProfile(currentUser.id);
        if (profile.isBlocked) {
          setLimitError('Sua conta está bloqueada pelo administrador. Não é possível enviar novos briefings.');
        } else if (profile.limitBriefings !== undefined && profile.limitBriefings !== null) {
          if (list.length >= profile.limitBriefings) {
            setLimitError(`Você atingiu o limite máximo de ${profile.limitBriefings} briefing(s) permitidos para sua conta.`);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      } finally {
        setCheckingLimit(false);
      }
    }

    void loadInitialData();
  }, [user]);

  // Sync user name with draft agent
  useEffect(() => {
    if (user && draft.agente !== user.nome) {
      setDraft((d) => ({ ...d, agente: user.nome }));
    }
  }, [user, draft.agente]);

  // Calculate user metrics
  const metrics = useMemo(() => {
    return {
      novo: briefingsList.filter((b) => b.status === 'novo').length,
      fazendo: briefingsList.filter((b) => b.status === 'em_andamento').length,
      concluido: briefingsList.filter((b) => b.status === 'concluido').length,
    };
  }, [briefingsList]);

  const trimestresOptions = useMemo(() => {
    const list = briefingsList.map((b) => b.trimestre).filter((t): t is string => Boolean(t));
    const unique = Array.from(new Set(list));
    return ['todos', ...unique.sort()];
  }, [briefingsList]);

  const filteredBriefings = useMemo(() => {
    return briefingsList.filter((b) => filterTrimestre === 'todos' || b.trimestre === filterTrimestre);
  }, [briefingsList, filterTrimestre]);

  const title = useMemo(() => ['Tipo de Serviço', 'Serviço Específico', 'Nome do Empreendimento', 'Cidade', 'Descrição detalhada da demanda', 'Anexos'][step], [step]);

  function validate() {
    if (step === 1 && draft.servico === 'Outro' && !draft.servico_outro?.trim()) return 'Especifique o serviço.';
    if (step === 2 && draft.empreendimento.trim().length < 2) return 'Informe o nome do empreendimento.';
    if (step === 3 && draft.cidade.trim().length < 2) return 'Informe a cidade.';
    if (step === 4 && draft.descricao.trim().length < 10) return 'A descrição precisa ter no mínimo 10 caracteres.';
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
    if (paused && !editingBriefing) {
      toast.error('O recebimento de briefings está pausado no momento.');
      return;
    }
    setSubmitting(true);
    try {
      if (editingBriefing) {
        await updateBriefing(editingBriefing.id, draft, files, filesToRemove);
        toast.success('Briefing atualizado com sucesso.');
      } else {
        await createBriefing(draft, files, user);
        toast.success('Briefing enviado com sucesso.');
      }
      // Reload briefings and go to success or home portal
      const updatedList = await getBriefings(user);
      setBriefingsList(updatedList);
      setViewMode('portal');
      setStep(0);
      setDraft({ ...initialDraft, agente: user.nome });
      setFiles([]);
      setEditingBriefing(null);
      setFilesToRemove([]);
    } catch (err) {
      console.error('Erro ao processar briefing:', err);
      const msg = err instanceof Error ? err.message : 'Não foi possível salvar o briefing.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditBriefing(briefing: Briefing) {
    setEditingBriefing(briefing);
    setFilesToRemove([]);
    setDraft({
      agente: briefing.agente,
      tipo_servico: briefing.tipo_servico,
      servico: briefing.servico,
      servico_outro: briefing.servico_outro || '',
      empreendimento: briefing.empreendimento,
      cidade: briefing.cidade,
      descricao: briefing.descricao,
    });
    setFiles([]);
    setStep(0);
    setViewMode('create');
  }

  function handleStartNewBriefing() {
    if (limitError) {
      toast.error(limitError);
      return;
    }
    if (paused) {
      toast.error('O recebimento de briefings está pausado.');
      return;
    }
    // Start empty
    setDraft({
      ...initialDraft,
      agente: user?.nome || '',
    });
    setFiles([]);
    setStep(0);
    setViewMode('create');
  }

  const toggleExpandBriefing = (id: string) => {
    setExpandedBriefingId(expandedBriefingId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* VIEW 1: PORTAL/DASHBOARD VIEW */}
        {viewMode === 'portal' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-black text-stone-950">Olá, {user?.nome}!</h1>
              <p className="text-stone-500">Acompanhe suas solicitações ou crie um novo briefing de serviço.</p>
            </div>

            {paused && (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                <PauseCircle className="shrink-0" size={20} /> O recebimento de novos briefings está pausado temporariamente.
              </div>
            )}

            {/* Small Dashboard Metrics */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="panel p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-stone-500">Novo</p>
                  <p className="mt-1 text-3xl font-black text-stone-950">{metrics.novo}</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-800">
                  <ClipboardList size={22} />
                </div>
              </div>
              <div className="panel p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-stone-500">Fazendo</p>
                  <p className="mt-1 text-3xl font-black text-stone-950">{metrics.fazendo}</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-800">
                  <Clock3 size={22} />
                </div>
              </div>
              <div className="panel p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-stone-500">Concluído</p>
                  <p className="mt-1 text-3xl font-black text-stone-950">{metrics.concluido}</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
                  <CheckCircle2 size={22} />
                </div>
              </div>
            </div>

            {/* 2x Big Action Buttons */}
            <div className="grid gap-6 md:grid-cols-2">
              <button
                type="button"
                onClick={handleStartNewBriefing}
                className="group flex flex-col items-center justify-center rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-card transition-all hover:border-cesol-300 hover:shadow-soft active:scale-95"
              >
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-cesol-50 text-cesol-600 transition-colors group-hover:bg-cesol-100 group-hover:text-cesol-700">
                  <PlusCircle size={32} />
                </div>
                <h3 className="mt-5 text-xl font-black text-stone-950">NOVO BRIEFING</h3>
                <p className="mt-2 max-w-xs text-sm text-stone-500">
                  Preencha o questionário passo a passo para enviar uma nova solicitação de design.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="group flex flex-col items-center justify-center rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-card transition-all hover:border-stone-300 hover:shadow-soft active:scale-95"
              >
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-stone-100 text-stone-600 transition-colors group-hover:bg-stone-200 group-hover:text-stone-700">
                  <FolderOpen size={32} />
                </div>
                <h3 className="mt-5 text-xl font-black text-stone-950">VER BRIEFINGS SOLICITADOS</h3>
                <p className="mt-2 max-w-xs text-sm text-stone-500">
                  Veja a lista completa, status de andamento e feedbacks da equipe operacional.
                </p>
              </button>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: MULTI-STEP CREATION FORM */}
        {viewMode === 'create' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setViewMode('portal');
                  setEditingBriefing(null);
                  setFilesToRemove([]);
                  setDraft({ ...initialDraft, agente: user?.nome || '' });
                  setFiles([]);
                  setStep(0);
                }}
                className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-cesol-800"
                type="button"
              >
                <ArrowLeft size={16} /> Voltar ao Painel
              </button>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-stone-500">Etapa {step + 1} de {total}</p>
                <div className="text-xs font-bold text-stone-400">
                  {editingBriefing ? 'Editar Briefing' : 'Novo Briefing'}
                </div>
              </div>
              <ProgressBar value={progress} />
            </div>

            <section className="panel flex flex-col justify-center p-5 sm:p-8 lg:p-10">
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
                    onClick={() => setViewMode('portal')}
                    className="btn-primary mt-6"
                    type="button"
                  >
                    Voltar ao Painel
                  </button>
                </div>
              ) : (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.24 }}>
                      <h1 className="text-3xl font-black text-stone-950 sm:text-4xl">{title}</h1>
                      <p className="mt-2 text-xs font-bold text-cesol-600">
                        {editingBriefing ? `Editando: ${editingBriefing.trimestre}` : `Destinado ao: ${activeQuarter}º Trimestre/051.2024`}
                      </p>
                      <div className="mt-8">
                        {step === 0 && <OptionGrid items={['CRIAÇÃO', 'MELHORIA']} value={draft.tipo_servico} onChange={(tipo_servico) => setDraft({ ...draft, tipo_servico: tipo_servico as ServiceType })} />}
                        {step === 1 && (
                          <div className="space-y-5">
                            <OptionGrid items={servicos} value={draft.servico} onChange={(servico) => setDraft({ ...draft, servico: servico as ServiceName })} />
                            {draft.servico === 'Outro' && <input className="input" value={draft.servico_outro} onChange={(event) => setDraft({ ...draft, servico_outro: event.target.value })} placeholder="Especifique o serviço" />}
                          </div>
                        )}
                        {step === 2 && <input className="input text-lg" value={draft.empreendimento} onChange={(event) => setDraft({ ...draft, empreendimento: event.target.value })} placeholder="Ex.: Sabores da Serra" />}
                        {step === 3 && <input className="input text-lg" value={draft.cidade} onChange={(event) => setDraft({ ...draft, cidade: event.target.value })} placeholder="Ex.: Jacobina" />}
                        {step === 4 && (
                          <div>
                            <textarea className="input min-h-56 resize-none text-base leading-7" value={draft.descricao} onChange={(event) => setDraft({ ...draft, descricao: event.target.value })} placeholder="Descreva objetivo, público, referências, prazos e observações importantes." />
                            <p className={cn('mt-2 text-right text-sm font-semibold', draft.descricao.length < 10 ? 'text-red-500' : 'text-emerald-600')}>{draft.descricao.length} caracteres</p>
                          </div>
                        )}
                        {step === 5 && (
                          <div className="space-y-6">
                            {editingBriefing && editingBriefing.arquivos.filter(f => !filesToRemove.includes(f.id)).length > 0 && (
                              <div>
                                <p className="mb-2 text-sm font-bold text-stone-500">Arquivos atualmente anexados (clique na lixeira para remover):</p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {editingBriefing.arquivos
                                    .filter((file) => !filesToRemove.includes(file.id))
                                    .map((file) => (
                                      <div key={file.id} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3 text-xs">
                                        <span className="flex items-center gap-2 min-w-0">
                                          <Paperclip className="text-cesol-600 shrink-0" size={15} />
                                          <span className="truncate font-bold text-stone-700">{file.nome}</span>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setFilesToRemove((prev) => [...prev, file.id])}
                                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-stone-100 shrink-0 ml-2"
                                          title="Excluir arquivo"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                            <div>
                              <p className="mb-2 text-sm font-bold text-stone-500">{editingBriefing ? 'Adicionar novos arquivos:' : 'Anexar arquivos:'}</p>
                              <FileUpload files={files} onChange={setFiles} />
                            </div>
                          </div>
                        )}
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
                      <button className="btn-primary" disabled={submitting || (paused && !editingBriefing)} onClick={submit} type="button">
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                        {editingBriefing ? 'Salvar alterações' : 'Finalizar briefing'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </section>
          </motion.div>
        )}

        {/* VIEW 3: HISTORICAL LIST VIEW */}
        {viewMode === 'list' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <button
                onClick={() => setViewMode('portal')}
                className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-cesol-800 animate-none"
                type="button"
              >
                <ArrowLeft size={16} /> Voltar ao Painel
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-stone-400">Filtrar Trimestre:</span>
                <select
                  value={filterTrimestre}
                  onChange={(e) => setFilterTrimestre(e.target.value)}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 outline-none"
                >
                  {trimestresOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'todos' ? 'Todos os Trimestres' : opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredBriefings.length === 0 ? (
                <div className="panel p-10 text-center">
                  <p className="text-stone-500 font-bold">Nenhum briefing solicitado neste trimestre.</p>
                  <button
                    onClick={handleStartNewBriefing}
                    className="btn-primary mt-4"
                    type="button"
                  >
                    Fazer meu primeiro briefing
                  </button>
                </div>
              ) : (
                filteredBriefings.map((briefing) => {
                  const isExpanded = expandedBriefingId === briefing.id;
                  return (
                    <div key={briefing.id} className="panel overflow-hidden transition-all duration-200 hover:border-stone-300">
                      {/* Accordion header */}
                      <button
                        type="button"
                        onClick={() => toggleExpandBriefing(briefing.id)}
                        className="flex w-full items-center justify-between p-5 text-left active:bg-stone-50"
                      >
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-black text-stone-950">{briefing.empreendimento}</h3>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-stone-500">
                            <span className="flex items-center gap-1"><Calendar size={13} /> {formatDate(briefing.created_at)}</span>
                            <span className="flex items-center gap-1"><MapPin size={13} /> {briefing.cidade}</span>
                            <span>{briefing.servico === 'Outro' ? briefing.servico_outro : briefing.servico}</span>
                            {briefing.trimestre && <span className="text-cesol-600 font-bold">{briefing.trimestre}</span>}
                          </div>
                        </div>
                        <div className="ml-4 flex items-center gap-3">
                          <StatusBadge status={briefing.status} />
                          {isExpanded ? <ChevronUp className="text-stone-400" size={18} /> : <ChevronDown className="text-stone-400" size={18} />}
                        </div>
                      </button>

                      {/* Accordion content */}
                      {isExpanded && (
                        <div className="border-t border-stone-100 bg-stone-50/50 p-5 space-y-6">
                          {/* Details */}
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Descrição Detalhada</h4>
                            <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-stone-700">{briefing.descricao}</p>
                          </div>

                          {/* Attachments */}
                          {briefing.arquivos && briefing.arquivos.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Arquivos Anexados</h4>
                              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {briefing.arquivos.map((file) => (
                                  <a
                                    key={file.id}
                                    href={file.url}
                                    download={file.nome}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3 text-xs hover:bg-stone-50"
                                  >
                                    <span className="flex items-center gap-2 min-w-0">
                                      <Paperclip className="text-cesol-600 shrink-0" size={15} />
                                      <span className="truncate font-bold text-stone-700">{file.nome}</span>
                                    </span>
                                    <span className="flex items-center gap-2 shrink-0 ml-2">
                                      <span className="text-[10px] text-stone-400">{formatBytes(file.tamanho)}</span>
                                      <Download className="text-stone-400 hover:text-stone-700" size={14} />
                                    </span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Comments */}
                          {briefing.comentarios && briefing.comentarios.length > 0 && (
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Respostas e Feedback da Gestão</h4>
                              <div className="mt-2 space-y-2">
                                {briefing.comentarios.map((c) => (
                                  <div key={c.id} className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
                                    <div className="flex justify-between items-center gap-2 mb-1">
                                      <span className="font-bold text-stone-900">{c.autor}</span>
                                      <span className="text-[10px] text-stone-400">{formatDate(c.created_at)}</span>
                                    </div>
                                    <p className="text-stone-600 leading-relaxed">{c.texto}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* History */}
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Histórico de Alterações</h4>
                            <div className="mt-2 space-y-2">
                              {briefing.historico && briefing.historico.map((h) => (
                                <div key={h.id} className="flex items-center gap-2 text-xs text-stone-600">
                                  <span className="h-1.5 w-1.5 rounded-full bg-cesol-600 shrink-0" />
                                  <span className="font-bold">{h.texto}</span>
                                  <span className="text-stone-400">({formatDate(h.created_at)})</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Ações de Edição e Exclusão */}
                          {briefing.status === 'novo' && (
                            <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
                              <button
                                type="button"
                                onClick={() => handleEditBriefing(briefing)}
                                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 hover:text-stone-900 shadow-sm transition-all"
                              >
                                <Edit3 size={14} /> Editar Briefing
                              </button>
                              <button
                                type="button"
                                onClick={() => setRemoveId(briefing.id)}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 hover:text-red-800 shadow-sm transition-all"
                              >
                                <Trash2 size={14} /> Excluir Briefing
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

      </main>

      <ConfirmModal
        open={Boolean(removeId)}
        title="Excluir briefing?"
        description="Esta solicitação será removida permanentemente. Essa ação não pode ser desfeita."
        onCancel={() => setRemoveId(null)}
        onConfirm={async () => {
          if (!removeId) return;
          try {
            await deleteBriefing(removeId);
            toast.success('Briefing excluído com sucesso.');
            if (user) {
              const updatedList = await getBriefings(user);
              setBriefingsList(updatedList);
            }
          } catch (err) {
            console.error('Erro ao excluir briefing:', err);
            toast.error('Erro ao excluir o briefing.');
          } finally {
            setRemoveId(null);
          }
        }}
      />
    </div>
  );
}

function OptionGrid({ items, value, onChange }: { items: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <button
          key={item}
          className={cn(
            'rounded-2xl border p-5 text-left text-lg font-black transition-all duration-200',
            value === item
              ? 'border-cesol-500 bg-cesol-50 text-cesol-900 shadow-card'
              : 'border-stone-200 bg-white text-stone-700 hover:border-cesol-200 hover:bg-cesol-50/60'
          )}
          onClick={() => onChange(item)}
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
