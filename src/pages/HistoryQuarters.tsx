import {
  Archive,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  History,
  Layers,
  Search,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmModal } from '../components/ConfirmModal';
import { EmptyState } from '../components/EmptyState';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import {
  deleteBriefing,
  getBriefings,
  getSettings,
  getUsers,
  updateBriefingStatus,
} from '../services/dataProvider';
import { Briefing, BriefingStatus } from '../types';
import { cn } from '../utils/cn';
import { formatDate } from '../utils/format';
import {
  UNTAGGED_QUARTER_LABEL,
  extractQuarterNumber,
  formatQuarterLabel,
  getAllHistoricalQuarters,
  isQuarterMatch,
} from '../utils/quarterUtils';

export function HistoryQuarters() {
  const { user } = useAuth();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [activeQuarter, setActiveQuarter] = useState(8);
  const [maxClosedQuarter, setMaxClosedQuarter] = useState(7);
  const [createdQuarters, setCreatedQuarters] = useState<number[]>([]);
  const [paused, setPaused] = useState(false);

  // Selected quarter in history
  const [selectedQuarter, setSelectedQuarter] = useState<string>('todos');

  // Filters
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('todos');
  const [agente, setAgente] = useState('todos');
  const [servico, setServico] = useState('todos');

  const [removeId, setRemoveId] = useState<string | null>(null);
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
        setCreatedQuarters(settings.createdQuarters || [settings.activeQuarter || 8]);
      })
      .catch(() => setPaused(false));
  }, [refresh]);

  // All historical quarters (ONLY quarters that were actually created in the system)
  const historicalQuarters = useMemo(() => {
    return getAllHistoricalQuarters(briefings, createdQuarters, activeQuarter, paused);
  }, [briefings, createdQuarters, activeQuarter, paused]);

  // Check if there are briefings without a quarter set
  const hasUntaggedBriefings = useMemo(() => {
    return briefings.some((b) => !b.trimestre || !b.trimestre.trim());
  }, [briefings]);

  // When historicalQuarters load, set default selection to the most recently closed quarter
  useEffect(() => {
    if (selectedQuarter === 'todos' && historicalQuarters.length > 0) {
      // Default to the first closed quarter
      setSelectedQuarter(historicalQuarters[0]);
    }
  }, [historicalQuarters, selectedQuarter]);

  // Filter historical briefings for the selected quarter
  const historicalBriefings = useMemo(() => {
    return briefings.filter((briefing) => {
      // If system is NOT paused, exclude briefings belonging to the active quarter
      if (!paused && isQuarterMatch(briefing.trimestre, activeQuarter)) {
        return false;
      }

      if (selectedQuarter === 'todos') {
        return true;
      }

      if (selectedQuarter === UNTAGGED_QUARTER_LABEL) {
        return !briefing.trimestre || !briefing.trimestre.trim();
      }

      // Match by quarter label or number
      const qNum = extractQuarterNumber(selectedQuarter);
      if (qNum !== null) {
        return isQuarterMatch(briefing.trimestre, qNum);
      }

      return briefing.trimestre === selectedQuarter;
    });
  }, [briefings, paused, activeQuarter, selectedQuarter]);

  // Metrics for the currently selected quarter
  const metrics = useMemo(() => {
    return {
      total: historicalBriefings.length,
      novos: historicalBriefings.filter((item) => item.status === 'novo').length,
      andamento: historicalBriefings.filter((item) => item.status === 'em_andamento').length,
      concluidos: historicalBriefings.filter((item) => item.status === 'concluido').length,
    };
  }, [historicalBriefings]);

  // Filtered by search terms
  const filtered = useMemo(() => {
    return historicalBriefings
      .filter((briefing) => status === 'todos' || briefing.status === status)
      .filter((briefing) => agente === 'todos' || briefing.agente === agente)
      .filter((briefing) => servico === 'todos' || briefing.servico === servico)
      .filter((briefing) =>
        `${briefing.empreendimento} ${briefing.cidade} ${briefing.agente}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [historicalBriefings, status, agente, servico, query]);

  // Helper count of briefings per quarter for chips
  const countPerQuarter = useCallback(
    (qLabel: string) => {
      const qNum = extractQuarterNumber(qLabel);
      if (qNum !== null) {
        return briefings.filter((b) => isQuarterMatch(b.trimestre, qNum)).length;
      }
      return briefings.filter((b) => b.trimestre === qLabel).length;
    },
    [briefings]
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cesol-800">
                Administração
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-xs font-bold text-stone-500">Histórico de Trimestres</span>
            </div>
            <h1 className="mt-1 text-3xl font-black text-stone-950 flex items-center gap-3">
              <History className="text-cesol-700" size={30} />
              Histórico de Trimestres
            </h1>
            <p className="mt-1 text-xs text-stone-500">
              Consulte e audite briefings de todos os ciclos e trimestres anteriores fechados.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-stone-500">
              Trimestre Atual:
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-700">
              <span className={cn('h-2 w-2 rounded-full', paused ? 'bg-amber-500' : 'bg-emerald-500')} />
              {paused ? 'Pausado/Fechado' : formatQuarterLabel(activeQuarter)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Quarter Selection Panel */}
        <div className="panel p-5 bg-gradient-to-r from-stone-900 to-stone-950 text-white border-stone-800 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cesol-400">
                Seletor de Período Histórico
              </span>
              <h2 className="mt-1 text-xl font-black text-white">
                {selectedQuarter === 'todos'
                  ? 'Todos os Trimestres Anteriores'
                  : selectedQuarter}
              </h2>
              <p className="mt-1 text-xs text-stone-400">
                Mostrando os dados e solicitações arquivadas deste período.
              </p>
            </div>

            {/* Quarter dropdown */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-xs font-bold text-stone-400">Selecionar Trimestre:</span>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="rounded-xl border border-stone-700 bg-stone-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm outline-none focus:border-cesol-500"
              >
                <option value="todos">Todos os Trimestres Anteriores</option>
                {historicalQuarters.map((q) => (
                  <option key={q} value={q}>
                    {q} ({countPerQuarter(q)} briefings)
                  </option>
                ))}
                {hasUntaggedBriefings && (
                  <option value={UNTAGGED_QUARTER_LABEL}>
                    {UNTAGGED_QUARTER_LABEL}
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* Quick chips / pills for quarters */}
          <div className="mt-4 pt-4 border-t border-stone-800 flex flex-wrap items-center gap-2">
            <span className="text-xs text-stone-400 font-bold mr-1">Atalhos rápidos:</span>
            <button
              onClick={() => setSelectedQuarter('todos')}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-bold transition-all',
                selectedQuarter === 'todos'
                  ? 'bg-cesol-600 text-white ring-2 ring-cesol-400'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              )}
              type="button"
            >
              Todos ({briefings.length})
            </button>
            {historicalQuarters.map((q) => {
              const isSelected = selectedQuarter === q;
              const count = countPerQuarter(q);
              return (
                <button
                  key={q}
                  onClick={() => setSelectedQuarter(q)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all',
                    isSelected
                      ? 'bg-cesol-600 text-white ring-2 ring-cesol-400'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  )}
                  type="button"
                >
                  <span>{q.split('/')[0]}</span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.2 text-[10px] font-semibold',
                      isSelected ? 'bg-cesol-700 text-white' : 'bg-stone-700 text-stone-300'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
            {hasUntaggedBriefings && (
              <button
                onClick={() => setSelectedQuarter(UNTAGGED_QUARTER_LABEL)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-bold transition-all',
                  selectedQuarter === UNTAGGED_QUARTER_LABEL
                    ? 'bg-cesol-600 text-white ring-2 ring-cesol-400'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                )}
                type="button"
              >
                Sem Trimestre
              </button>
            )}
          </div>
        </div>

        {/* Metrics for the selected quarter */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total no Período"
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

        {/* Filter bar */}
        <div className="panel p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_160px]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">
                Pesquisar no Histórico
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 text-stone-400" size={18} />
                <input
                  className="input pl-10"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Pesquisar por empreendimento, cidade ou técnico..."
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">
                Status
              </span>
              <Select
                value={status}
                onChange={setStatus}
                options={['todos', 'novo', 'em_andamento', 'concluido']}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">
                Técnico
              </span>
              <Select value={agente} onChange={setAgente} options={['todos', ...tecnicos]} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">
                Serviço
              </span>
              <Select
                value={servico}
                onChange={setServico}
                options={['todos', 'Rotulagem', 'Logotipo', 'Rede Social', 'Outro']}
              />
            </label>
          </div>
        </div>

        {/* Table or Empty State */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
          {historicalBriefings.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-stone-100 text-stone-500">
                <Archive size={28} />
              </div>
              <h3 className="text-xl font-black text-stone-950">
                Nenhum briefing preenchido no {selectedQuarter}
              </h3>
              <p className="mx-auto max-w-md text-sm text-stone-500">
                Este trimestre está devidamente registrado no histórico, porém nenhuma solicitação foi enviada nele (total de 0 briefings).
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setSelectedQuarter('todos')}
                  className="btn-secondary text-xs inline-flex items-center gap-2"
                  type="button"
                >
                  <History size={15} /> Ver todos os trimestres anteriores
                </button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Nenhum briefing encontrado"
              description="Ajuste os filtros de pesquisa ou status para localizar solicitações."
            />
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
                      <td className="px-5 py-4 text-xs font-bold text-stone-500">
                        <span className="rounded-md bg-stone-100 px-2 py-1 text-stone-700">
                          {briefing.trimestre || 'Não especificado'}
                        </span>
                      </td>
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

      <ConfirmModal
        open={Boolean(removeId)}
        title="Excluir briefing?"
        description="Essa solicitação será removida permanentemente do histórico."
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
