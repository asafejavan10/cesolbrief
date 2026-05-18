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
import { deleteBriefing, getBriefings, getSettings, setBriefingsPaused, updateBriefingStatus } from '../services/dataProvider';
import { Briefing } from '../types';
import { BriefingStatus } from '../types';
import { formatDate } from '../utils/format';

export function Dashboard() {
  const { user } = useAuth();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [paused, setPaused] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('todos');
  const [agente, setAgente] = useState('todos');
  const [servico, setServico] = useState('todos');
  const [removeId, setRemoveId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return briefings
      .filter((briefing) => status === 'todos' || briefing.status === status)
      .filter((briefing) => agente === 'todos' || briefing.agente === agente)
      .filter((briefing) => servico === 'todos' || briefing.servico === servico)
      .filter((briefing) => `${briefing.empreendimento} ${briefing.cidade} ${briefing.agente}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [agente, briefings, query, servico, status]);

  const refresh = useCallback(async () => {
    setBriefings(await getBriefings(user));
  }, [user]);

  useEffect(() => {
    void refresh();
    getSettings().then((settings) => setPaused(settings.briefingsPaused)).catch(() => setPaused(false));
  }, [refresh]);

  async function togglePaused() {
    await setBriefingsPaused(!paused);
    setPaused(!paused);
    toast.success(!paused ? 'Recebimento pausado.' : 'Recebimento reativado.');
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
          <button className={paused ? 'btn-primary bg-emerald-700 hover:bg-emerald-800' : 'btn-secondary'} onClick={togglePaused} type="button">
            {paused ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
            {paused ? 'Reativar sistema' : 'Pausar recebimento'}
          </button>
        </div>
      </div>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {paused && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Recebimento de novos briefings pausado para usuários comuns.</div>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total" value={metrics.total} icon={ClipboardList} tone="bg-cesol-50 text-cesol-800" />
          <MetricCard label="Novos" value={metrics.novos} icon={TrendingUp} tone="bg-amber-50 text-amber-800" />
          <MetricCard label="Em andamento" value={metrics.andamento} icon={Archive} tone="bg-blue-50 text-blue-800" />
          <MetricCard label="Concluídos" value={metrics.concluidos} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-800" />
        </div>
        <div className="panel mt-6 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 text-stone-400" size={18} />
              <input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar empreendimento, cidade ou técnico" />
            </div>
            <Select value={status} onChange={setStatus} options={['todos', 'novo', 'em_andamento', 'concluido']} />
            <Select value={agente} onChange={setAgente} options={['todos', 'Wendel', 'Deive', 'Andiara', 'Débora', 'Lusimere']} />
            <Select value={servico} onChange={setServico} options={['todos', 'Rotulagem', 'Logotipo', 'Rede Social', 'Outro']} />
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
