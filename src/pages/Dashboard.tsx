import {
  Archive,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  History,
  PauseCircle,
  PlayCircle,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmModal } from '../components/ConfirmModal';
import { DashboardFilters, TechnicianItem } from '../components/DashboardFilters';
import { EmptyState } from '../components/EmptyState';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import {
  closeQuarter,
  deleteBriefing,
  getBriefings,
  getSettings,
  getUsers,
  openQuarter,
  updateBriefingStatus,
} from '../services/dataProvider';
import { Briefing, BriefingStatus } from '../types';
import { formatDate } from '../utils/format';
import { formatQuarterLabel, isQuarterMatch } from '../utils/quarterUtils';

export function Dashboard() {
  const { user } = useAuth();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [paused, setPaused] = useState(false);
  const [activeQuarter, setActiveQuarter] = useState(8);
  const [maxClosedQuarter, setMaxClosedQuarter] = useState(7);

  // Filters for Vigente
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('todos');
  const [agente, setAgente] = useState('todos');
  const [servico, setServico] = useState('todos');

  const [removeId, setRemoveId] = useState<string | null>(null);
  const [openQuarterModal, setOpenQuarterModal] = useState(false);
  const [quarterInput, setQuarterInput] = useState('');
  const [tecnicos, setTecnicos] = useState<TechnicianItem[]>([]);

  useEffect(() => {
    getUsers()
      .then((usersList) => {
        const userAvatarMap = new Map<string, string | null>();
        usersList.forEach((u) => {
          userAvatarMap.set(u.nome.toLowerCase(), u.avatar_url || null);
        });

        const registeredTecnicos = usersList.filter((u) => !u.isAdmin).map((u) => u.nome);
        const briefingAgentes = briefings.map((b) => b.agente).filter(Boolean);
        const allNames = Array.from(new Set([...registeredTecnicos, ...briefingAgentes])).sort((a, b) =>
          a.localeCompare(b)
        );

        const items: TechnicianItem[] = allNames.map((nome) => ({
          nome,
          avatar_url: userAvatarMap.get(nome.toLowerCase()) || null,
        }));

        setTecnicos(items);
      })
      .catch(() => {
        const briefingAgentes = briefings.map((b) => b.agente).filter(Boolean);
        const uniqueNames = Array.from(new Set(briefingAgentes)).sort((a, b) => a.localeCompare(b));
        setTecnicos(uniqueNames.map((nome) => ({ nome, avatar_url: null })));
      });
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

  // Briefings strictly for the active current quarter
  const currentQuarterBriefings = useMemo(() => {
    return briefings.filter((b) => isQuarterMatch(b.trimestre, activeQuarter));
  }, [briefings, activeQuarter]);

  const filtered = useMemo(() => {
    return currentQuarterBriefings
      .filter((briefing) => status === 'todos' || briefing.status === status)
      .filter((briefing) => agente === 'todos' || briefing.agente === agente)
      .filter((briefing) => servico === 'todos' || briefing.servico === servico)
      .filter((briefing) =>
        `${briefing.empreendimento} ${briefing.cidade} ${briefing.agente}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [agente, currentQuarterBriefings, query, servico, status]);

  const metrics = useMemo(() => {
    return {
      total: currentQuarterBriefings.length,
      novos: currentQuarterBriefings.filter((item) => item.status === 'novo').length,
      andamento: currentQuarterBriefings.filter((item) => item.status === 'em_andamento').length,
      concluidos: currentQuarterBriefings.filter((item) => item.status === 'concluido').length,
    };
  }, [currentQuarterBriefings]);

  async function handleCloseQuarter() {
    try {
      await closeQuarter(activeQuarter);
      setPaused(true);
      setMaxClosedQuarter(activeQuarter);
      toast.success(
        `Trimestre ${activeQuarter} fechado com sucesso! Os briefings anteriores foram arquivados no Histórico.`
      );
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
      toast.success(
        `Trimestre ${qNumber} aberto com sucesso! A tela foi zerada para receber novos briefings.`
      );
    } catch {
      toast.error('Erro ao abrir o trimestre.');
    }
  }

  return (
    <DashboardLayout>
      {/* Top Header */}
      <div className="border-b border-stone-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cesol-800">
                Dashboard administrativo
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-xs font-bold text-stone-500">Trimestre Vigente</span>
            </div>
            <h1 className="mt-1 text-3xl font-black text-stone-950">Briefings</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-stone-500">
              Trimestre: <strong className="text-stone-900">{paused ? 'Fechado/Pausado' : formatQuarterLabel(activeQuarter)}</strong>
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
                <PlayCircle size={18} /> Abrir {maxClosedQuarter + 1}º Trimestre
              </button>
            ) : (
              <button className="btn-secondary" onClick={handleCloseQuarter} type="button">
                <PauseCircle size={18} /> Fechar {activeQuarter}º Trimestre
              </button>
            )}
            <Link
              to="/dashboard/historico"
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <History size={16} /> Ver Histórico
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {paused && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <PauseCircle className="shrink-0 text-amber-600" size={22} />
              <div>
                <p className="font-bold">O {activeQuarter}º Trimestre foi fechado (recebimento pausado).</p>
                <p className="text-xs text-amber-700 font-normal">
                  Todos os briefings anteriores estão no menu <strong>Histórico de Trimestres</strong>. Para iniciar o novo ciclo com a tela zerada, abra o próximo trimestre.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-primary bg-emerald-700 hover:bg-emerald-800 text-xs py-2 px-3 font-bold shrink-0"
                onClick={() => {
                  setQuarterInput(String(maxClosedQuarter + 1));
                  setOpenQuarterModal(true);
                }}
                type="button"
              >
                <PlayCircle size={15} /> Abrir {maxClosedQuarter + 1}º Trimestre
              </button>
              <Link
                to="/dashboard/historico"
                className="btn-secondary bg-white text-xs py-2 px-3 shrink-0 inline-flex items-center gap-1"
              >
                <History size={14} /> Acessar Histórico
              </Link>
            </div>
          </div>
        )}

        {/* Metrics for Vigente */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={`Total no ${activeQuarter}º Trimestre`}
            value={metrics.total}
            icon={ClipboardList}
            tone="bg-cesol-50 text-cesol-800"
          />
          <MetricCard
            label="Novos"
            value={metrics.novos}
            icon={TrendingUp}
            tone="bg-amber-50 text-amber-800"
          />
          <MetricCard
            label="Em andamento"
            value={metrics.andamento}
            icon={Archive}
            tone="bg-blue-50 text-blue-800"
          />
          <MetricCard
            label="Concluídos"
            value={metrics.concluidos}
            icon={CheckCircle2}
            tone="bg-emerald-50 text-emerald-800"
          />
        </div>

        {/* Filter toolbar */}
        <DashboardFilters
          query={query}
          onQueryChange={setQuery}
          tecnicos={tecnicos}
          selectedTecnico={agente}
          onTecnicoChange={setAgente}
          servico={servico}
          onServicoChange={setServico}
          status={status}
          onStatusChange={setStatus}
        />

        {/* Current Quarter Table or Empty State */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
          {currentQuarterBriefings.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cesol-50 text-cesol-700">
                <Sparkles size={28} />
              </div>
              <h3 className="text-xl font-black text-stone-950">
                {activeQuarter}º Trimestre iniciado e zerado!
              </h3>
              <p className="mx-auto max-w-md text-sm text-stone-500">
                A tela está zerada para este novo ciclo. As novas solicitações enviadas pelos técnicos aparecerão aqui.
              </p>
              <div className="pt-2">
                <Link
                  to="/dashboard/historico"
                  className="btn-secondary text-xs inline-flex items-center gap-2"
                >
                  <History size={16} /> Consultar trimestres anteriores no Histórico
                </Link>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Nenhum briefing encontrado"
              description="Ajuste os filtros de pesquisa ou status."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-5 py-4">Empreendimento</th>
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
                      <td className="px-5 py-4 text-sm text-stone-600">{briefing.agente}</td>
                      <td className="px-5 py-4 text-sm text-stone-600">{briefing.cidade}</td>
                      <td className="px-5 py-4 text-sm text-stone-600">
                        {briefing.servico === 'Outro' ? briefing.servico_outro : briefing.servico}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={briefing.status} />
                      </td>
                      <td className="px-5 py-4 text-sm text-stone-600">{formatDate(briefing.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            className="rounded-xl p-2 text-stone-500 hover:bg-cesol-50 hover:text-cesol-800"
                            to={`/dashboard/briefings/${briefing.id}`}
                            aria-label="Visualizar"
                          >
                            <Eye size={18} />
                          </Link>
                          <select
                            className="rounded-xl border border-stone-200 px-2 py-2 text-xs font-bold"
                            value={briefing.status}
                            onChange={(event) => {
                              updateBriefingStatus(briefing.id, event.target.value as BriefingStatus).then(refresh);
                            }}
                          >
                            <option value="novo">novo</option>
                            <option value="em_andamento">em andamento</option>
                            <option value="concluido">concluído</option>
                          </select>
                          <button
                            className="rounded-xl p-2 text-stone-500 hover:bg-stone-100"
                            onClick={() => toast.info('Download disponível na página de detalhes.')}
                            type="button"
                            aria-label="Baixar"
                          >
                            <Download size={18} />
                          </button>
                          <button
                            className="rounded-xl p-2 text-stone-500 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setRemoveId(briefing.id)}
                            type="button"
                            aria-label="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
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

      {/* Confirm remove modal */}
      <ConfirmModal
        open={Boolean(removeId)}
        title="Excluir briefing?"
        description="Essa solicitação será removida da listagem local. Em produção, a exclusão passa pelo endpoint serverless."
        onCancel={() => setRemoveId(null)}
        onConfirm={async () => {
          if (!removeId) return;
          try {
            await deleteBriefing(removeId);
            toast.success('Briefing excluído com sucesso.');
            await refresh();
          } catch (err) {
            console.error('Erro ao excluir briefing:', err);
            const msg = err instanceof Error ? err.message : 'Erro ao excluir o briefing.';
            toast.error(msg);
          } finally {
            setRemoveId(null);
          }
        }}
      />

      {/* Open Quarter Modal */}
      {openQuarterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200 bg-white">
            <h3 className="text-xl font-black text-stone-950">Qual trimestre você quer abrir?</h3>
            <p className="mt-2 text-sm text-stone-500">
              Informe o número do trimestre para abrir o recebimento de novos briefings e iniciar a tela com o novo ciclo.
            </p>

            <div className="mt-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Número do Trimestre
                </span>
                <input
                  type="number"
                  className="input text-lg font-black"
                  value={quarterInput}
                  onChange={(e) => setQuarterInput(e.target.value)}
                  placeholder="Ex.: 9"
                  min="1"
                />
              </label>
            </div>

            {quarterInput && Number(quarterInput) <= maxClosedQuarter && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
                <p className="font-bold">Atenção!</p>
                <p>O trimestre {quarterInput} já foi criado ou fechado anteriormente.</p>
                <p>
                  Deseja reabrir o trimestre {quarterInput} ou criar um novo trimestre ({Number(quarterInput) + 1})?
                </p>
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
                    Reabrir o {quarterInput}
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

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      className="input capitalize"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option.replace('_', ' ')}
        </option>
      ))}
    </select>
  );
}
