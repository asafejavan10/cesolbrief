import { Archive, CheckCircle2, ClipboardList, Download, Eye, PauseCircle, PlayCircle, Search, Trash2, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState } from '../components/EmptyState';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { deleteBriefing, getBriefings, getSettings, updateBriefingStatus, closeQuarter, openQuarter, getUsers } from '../services/dataProvider';
import { Briefing } from '../types';
import { BriefingStatus } from '../types';
import { formatDate } from '../utils/format';

export function Dashboard() {
  const { user } = useAuth();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [paused, setPaused] = useState(false);
  const [activeQuarter, setActiveQuarter] = useState(8);
  const [maxClosedQuarter, setMaxClosedQuarter] = useState(7);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('todos');
  const [trimestre, setTrimestre] = useState('todos');
  const [agente, setAgente] = useState('todos');
  const [servico, setServico] = useState('todos');
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [openQuarterModal, setOpenQuarterModal] = useState(false);
  const [quarterInput, setQuarterInput] = useState('');
  const [tecnicos, setTecnicos] = useState<string[]>([]);

  useEffect(() => {
    getUsers()
      .then((usersList) => {
        const registeredTecnicos = usersList.filter((u) => !u.isAdmin).map((u) => u.nome);
        const briefingAgentes = briefings.map((b) => b.agente).filter(Boolean);
        const allNames = [...registeredTecnicos, ...briefingAgentes];
        const uniqueNames = Array.from(new Set(allNames)).sort((a, b) => a.localeCompare(b));
        setTecnicos(uniqueNames);
      })
      .catch(() => {
        const briefingAgentes = briefings.map((b) => b.agente).filter(Boolean);
        const uniqueNames = Array.from(new Set(briefingAgentes)).sort((a, b) => a.localeCompare(b));
        setTecnicos(uniqueNames);
      });
  }, [briefings]);

  const filtered = useMemo(() => {
    return briefings
      .filter((briefing) => status === 'todos' || briefing.status === status)
      .filter((briefing) => trimestre === 'todos' || briefing.trimestre === trimestre)
      .filter((briefing) => agente === 'todos' || briefing.agente === agente)
      .filter((briefing) => servico === 'todos' || briefing.servico === servico)
      .filter((briefing) => `${briefing.empreendimento} ${briefing.cidade} ${briefing.agente}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [agente, briefings, query, servico, status, trimestre]);

  const trimestresOptions = useMemo(() => {
    const list = briefings.map((b) => b.trimestre).filter((t): t is string => Boolean(t));
    const unique = Array.from(new Set(list));
    return ['todos', ...unique.sort()];
  }, [briefings]);

  const refresh = useCallback(async () => {
    setBriefings(await getBriefings(user));
  }, [user]);

  useEffect(() => {
    void refresh();
    getSettings()
      .then((settings) => {
        setPaused(settings.briefingsPaused);
        setActiveQuarter(settings.activeQuarter);
        setMaxClosedQuarter(settings.maxClosedQuarter);
      })
      .catch(() => setPaused(false));
  }, [refresh]);

  async function handleCloseQuarter() {
    try {
      await closeQuarter(activeQuarter);
      setPaused(true);
      setMaxClosedQuarter(activeQuarter);
      toast.success(`Trimestre ${activeQuarter} fechado com sucesso.`);
    } catch {
      toast.error('Erro ao fechar o trimestre.');
    }
  }

  async function handleOpenQuarter(qNumber: number) {
    try {
      await openQuarter(qNumber);
      setPaused(false);
      setActiveQuarter(qNumber);
      
      let newMaxClosed = maxClosedQuarter;
      if (qNumber <= maxClosedQuarter) {
        newMaxClosed = qNumber - 1;
        setMaxClosedQuarter(newMaxClosed);
      }
      toast.success(`Trimestre ${qNumber} aberto com sucesso.`);
    } catch {
      toast.error('Erro ao abrir o trimestre.');
    }
  }

  const metrics = {
    total: briefings.length,
    novos: briefings.filter((item) => item.status === 'novo').length,
    andamento: briefings.filter((item) => item.status === 'em_andamento').length,
    concluidos: briefings.filter((item) => item.status === 'concluido').length,
  };

  return (
    <DashboardLayout>
      <div className="border-b border-stone-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-cesol-800">Dashboard administrativo</p>
            <h1 className="mt-1 text-3xl font-black text-stone-950">Briefings</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-stone-500">
              Trimestre: <strong className="text-stone-900">{paused ? 'Fechado/Pausado' : `${activeQuarter}º Trimestre/051.2024`}</strong>
            </span>
            {paused ? (
              <button
                className="btn-primary bg-emerald-700 hover:bg-emerald-800 animate-none font-semibold text-sm"
                onClick={() => {
                  setQuarterInput(String(maxClosedQuarter + 1));
                  setOpenQuarterModal(true);
                }}
                type="button"
              >
                <PlayCircle size={18} /> Abrir briefings
              </button>
            ) : (
              <button className="btn-secondary" onClick={handleCloseQuarter} type="button">
                <PauseCircle size={18} /> Fechar {activeQuarter}º Trimestre
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {paused && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Recebimento de novos briefings pausado para usuários comuns (Sem trimestre ativo).
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total" value={metrics.total} icon={ClipboardList} tone="bg-cesol-50 text-cesol-800" />
        <MetricCard label="Novos" value={metrics.novos} icon={TrendingUp} tone="bg-amber-50 text-amber-800" />
        <MetricCard label="Em andamento" value={metrics.andamento} icon={Archive} tone="bg-blue-50 text-blue-800" />
        <MetricCard label="Concluídos" value={metrics.concluidos} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-800" />
      </div>
      <div className="panel mt-6 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px_150px_150px]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">Pesquisar</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 text-stone-400" size={18} />
              <input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar por empreendimento, cidade ou técnico..." />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">Status</span>
            <Select value={status} onChange={setStatus} options={['todos', 'novo', 'em_andamento', 'concluido']} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">Trimestre</span>
            <Select value={trimestre} onChange={setTrimestre} options={trimestresOptions} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">Técnico</span>
            <Select value={agente} onChange={setAgente} options={['todos', ...tecnicos]} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">Serviço</span>
            <Select value={servico} onChange={setServico} options={['todos', 'Rotulagem', 'Logotipo', 'Rede Social', 'Outro']} />
          </label>
        </div>
      </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
          {filtered.length === 0 ? (
            <EmptyState title="Nenhum briefing encontrado" description="Ajuste filtros ou aguarde novas solicitações." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-5 py-4">Empreendimento</th>
                  <th className="px-5 py-4">Trimestre</th>
                  <th className="px-5 py-4">Técnico</th>
                  <th className="px-5 py-4">Cidade</th>
                  <th className="px-5 py-4">Serviço</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Data</th>
                  <th className="px-5 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((briefing) => (
                  <tr key={briefing.id} className="hover:bg-stone-50/80">
                    <td className="px-5 py-4 font-bold text-stone-950">{briefing.empreendimento}</td>
                    <td className="px-5 py-4 text-xs font-bold text-stone-500">{briefing.trimestre || '-'}</td>
                      <td className="px-5 py-4 text-sm text-stone-600">{briefing.agente}</td>
                      <td className="px-5 py-4 text-sm text-stone-600">{briefing.cidade}</td>
                      <td className="px-5 py-4 text-sm text-stone-600">{briefing.servico === 'Outro' ? briefing.servico_outro : briefing.servico}</td>
                      <td className="px-5 py-4"><StatusBadge status={briefing.status} /></td>
                      <td className="px-5 py-4 text-sm text-stone-600">{formatDate(briefing.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link className="rounded-xl p-2 text-stone-500 hover:bg-cesol-50 hover:text-cesol-800" to={`/dashboard/briefings/${briefing.id}`} aria-label="Visualizar"><Eye size={18} /></Link>
                          <select className="rounded-xl border border-stone-200 px-2 py-2 text-xs font-bold" value={briefing.status} onChange={(event) => { updateBriefingStatus(briefing.id, event.target.value as BriefingStatus).then(refresh); }}>
                            <option value="novo">novo</option>
                            <option value="em_andamento">em andamento</option>
                            <option value="concluido">concluído</option>
                          </select>
                          <button className="rounded-xl p-2 text-stone-500 hover:bg-stone-100" onClick={() => toast.info('Download disponível na página de detalhes.')} type="button" aria-label="Baixar"><Download size={18} /></button>
                          <button className="rounded-xl p-2 text-stone-500 hover:bg-red-50 hover:text-red-700" onClick={() => setRemoveId(briefing.id)} type="button" aria-label="Excluir"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        open={Boolean(removeId)}
        title="Excluir briefing?"
        description="Essa solicitação será removida da listagem local. Em produção, a exclusão passa pelo endpoint serverless."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) void deleteBriefing(removeId).then(refresh);
          setRemoveId(null);
          toast.success('Briefing excluído.');
        }}
      />
      {openQuarterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200 bg-white">
            <h3 className="text-xl font-black text-stone-950">Qual trimestre você quer abrir?</h3>
            <p className="mt-2 text-sm text-stone-500">Informe o número do trimestre para abrir o recebimento de novos briefings.</p>
            
            <div className="mt-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">Número do Trimestre</span>
                <input
                  type="number"
                  className="input text-lg font-black"
                  value={quarterInput}
                  onChange={(e) => setQuarterInput(e.target.value)}
                  placeholder="Ex.: 8"
                  min="1"
                />
              </label>
            </div>

            {quarterInput && Number(quarterInput) <= maxClosedQuarter && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
                <p className="font-bold">Atenção!</p>
                <p>O trimestre {quarterInput} já foi criado ou fechado anteriormente.</p>
                <p>Deseja continuar no trimestre atual ({quarterInput}) ou criar um novo trimestre ({Number(quarterInput) + 1})?</p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setOpenQuarterModal(false)}
              >
                Cancelar
              </button>
              
              {quarterInput && Number(quarterInput) <= maxClosedQuarter ? (
                <>
                  <button
                    type="button"
                    className="btn-primary bg-amber-600 hover:bg-amber-700"
                    onClick={() => {
                      void handleOpenQuarter(Number(quarterInput));
                      setOpenQuarterModal(false);
                    }}
                  >
                    Continuar no {quarterInput}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      void handleOpenQuarter(Number(quarterInput) + 1);
                      setOpenQuarterModal(false);
                    }}
                  >
                    Criar Novo ({Number(quarterInput) + 1})
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!quarterInput || Number(quarterInput) <= 0}
                  onClick={() => {
                    void handleOpenQuarter(Number(quarterInput));
                    setOpenQuarterModal(false);
                  }}
                >
                  Confirmar e Abrir
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <select className="input capitalize" value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option} value={option}>{option.replace('_', ' ')}</option>
      ))}
    </select>
  );
}
