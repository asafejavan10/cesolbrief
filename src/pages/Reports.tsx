import { BarChart3, Download, FileSpreadsheet, FileText, Filter, PieChart } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { getBriefings, getUsers } from '../services/dataProvider';
import { Briefing } from '../types';
import { exportCsv, exportExcel, exportPdf } from '../utils/exportReports';
import { formatDate } from '../utils/format';

export function Reports() {
  const { user } = useAuth();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [status, setStatus] = useState('todos');
  const [agente, setAgente] = useState('todos');
  const [servico, setServico] = useState('todos');
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

  useEffect(() => {
    getBriefings(user).then(setBriefings).catch(() => setBriefings([]));
  }, [user]);

  const filtered = useMemo(() => {
    return briefings
      .filter((briefing) => status === 'todos' || briefing.status === status)
      .filter((briefing) => agente === 'todos' || briefing.agente === agente)
      .filter((briefing) => servico === 'todos' || briefing.servico === servico)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [agente, briefings, servico, status]);

  async function exportWithFeedback(format: 'csv' | 'excel' | 'pdf') {
    if (filtered.length === 0) {
      toast.error('Não há dados para exportar com os filtros atuais.');
      return;
    }
    if (format === 'csv') exportCsv(filtered);
    if (format === 'excel') exportExcel(filtered);
    if (format === 'pdf') await exportPdf(filtered);
    toast.success('Relatório exportado.');
  }

  return (
    <DashboardLayout>
      <div className="border-b border-stone-200 bg-white px-4 py-5 pr-20 sm:px-6 lg:px-8">
        <p className="text-sm font-bold text-cesol-800">Relatórios</p>
        <h1 className="mt-1 text-3xl font-black text-stone-950">Análise de briefings</h1>
      </div>
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Registros filtrados" value={filtered.length} icon={BarChart3} tone="bg-cesol-50 text-cesol-800" />
          <MetricCard label="Novos" value={filtered.filter((item) => item.status === 'novo').length} icon={Filter} tone="bg-amber-50 text-amber-800" />
          <MetricCard label="Concluídos" value={filtered.filter((item) => item.status === 'concluido').length} icon={PieChart} tone="bg-emerald-50 text-emerald-800" />
          <MetricCard label="Anexos" value={filtered.reduce((total, item) => total + item.arquivos.length, 0)} icon={FileText} tone="bg-blue-50 text-blue-800" />
        </div>

        <section className="panel mt-6 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
            <div className="flex h-full items-end">
              <div className="flex w-full items-center gap-3 rounded-xl bg-stone-50 px-4 py-3 text-sm font-bold text-stone-600">
                <Filter size={18} /> Filtros do relatório
              </div>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">Status</span>
              <Select value={status} onChange={setStatus} options={['todos', 'novo', 'em_andamento', 'concluido']} />
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
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary" onClick={() => exportWithFeedback('csv')} type="button"><Download size={18} /> Exportar CSV</button>
            <button className="btn-secondary" onClick={() => exportWithFeedback('excel')} type="button"><FileSpreadsheet size={18} /> Exportar Excel</button>
            <button className="btn-secondary" onClick={() => exportWithFeedback('pdf')} type="button"><FileText size={18} /> Exportar PDF</button>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
          <div className="border-b border-stone-100 p-5">
            <h2 className="text-xl font-black text-stone-950">Prévia do relatório</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-4">Empreendimento</th>
                  <th className="px-5 py-4">Técnico</th>
                  <th className="px-5 py-4">Serviço</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Anexos</th>
                  <th className="px-5 py-4">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((briefing) => (
                  <tr key={briefing.id}>
                    <td className="px-5 py-4 font-bold text-stone-950">{briefing.empreendimento}</td>
                    <td className="px-5 py-4 text-sm text-stone-600">{briefing.agente}</td>
                    <td className="px-5 py-4 text-sm text-stone-600">{briefing.servico === 'Outro' ? briefing.servico_outro : briefing.servico}</td>
                    <td className="px-5 py-4"><StatusBadge status={briefing.status} /></td>
                    <td className="px-5 py-4 text-sm text-stone-600">{briefing.arquivos.length}</td>
                    <td className="px-5 py-4 text-sm text-stone-600">{formatDate(briefing.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
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
