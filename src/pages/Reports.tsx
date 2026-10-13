import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  PieChart,
  Image as ImageIcon,
  Table,
  ExternalLink,
  ZoomIn,
  X,
  Loader2,
  Paperclip,
  CheckCircle2,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { ProductImageThumb } from '../components/ProductImageThumb';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { getBriefings, getUsers } from '../services/dataProvider';
import { Briefing } from '../types';
import { exportCsv, exportExcel, exportPdf } from '../utils/exportReports';
import { formatBytes, formatDate } from '../utils/format';
import { getDistinctQuarters } from '../utils/quarterUtils';
import { cn } from '../utils/cn';

export function Reports() {
  const { user } = useAuth();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [status, setStatus] = useState('todos');
  const [trimestre, setTrimestre] = useState('todos');
  const [agente, setAgente] = useState('todos');
  const [servico, setServico] = useState('todos');
  const [tecnicos, setTecnicos] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'fotos' | 'tabela'>('fotos');
  const [onlyWithFinal, setOnlyWithFinal] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [zoomItem, setZoomItem] = useState<{
    url: string;
    nome: string;
    empreendimento: string;
    servico: string;
  } | null>(null);

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

  const trimestresOptions = useMemo(() => {
    return ['todos', ...getDistinctQuarters(briefings)];
  }, [briefings]);

  const filtered = useMemo(() => {
    return briefings
      .filter((briefing) => status === 'todos' || briefing.status === status)
      .filter((briefing) => trimestre === 'todos' || briefing.trimestre === trimestre)
      .filter((briefing) => agente === 'todos' || briefing.agente === agente)
      .filter((briefing) => servico === 'todos' || briefing.servico === servico)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [agente, briefings, servico, status, trimestre]);

  const withFinalCount = useMemo(() => {
    return filtered.filter((b) => b.arquivos.some((f) => f.is_final)).length;
  }, [filtered]);

  const galleryItems = useMemo(() => {
    if (onlyWithFinal) {
      return filtered.filter((b) => b.arquivos.some((f) => f.is_final));
    }
    return filtered;
  }, [filtered, onlyWithFinal]);

  async function exportWithFeedback(format: 'csv' | 'excel' | 'pdf') {
    if (filtered.length === 0) {
      toast.error('Não há dados para exportar com os filtros atuais.');
      return;
    }

    if (format === 'csv') {
      exportCsv(filtered);
      toast.success('Relatório CSV exportado com sucesso (inclui links do material final).');
    }

    if (format === 'excel') {
      exportExcel(filtered);
      toast.success('Relatório Excel exportado com sucesso (inclui links do material final).');
    }

    if (format === 'pdf') {
      try {
        setExportingPdf(true);
        toast.info('Processando imagens e gerando PDF com catálogo de produtos...');
        await exportPdf(filtered);
        toast.success('Relatório PDF exportado com sucesso!');
      } catch (err: any) {
        toast.error(err.message || 'Erro ao gerar o relatório PDF.');
      } finally {
        setExportingPdf(false);
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="border-b border-stone-200 bg-white px-4 py-5 pr-20 sm:px-6 lg:px-8">
        <p className="text-sm font-bold text-cesol-800">Relatórios & Catálogo</p>
        <h1 className="mt-1 text-3xl font-black text-stone-950">Análise de briefings e produtos</h1>
      </div>

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Registros filtrados" value={filtered.length} icon={BarChart3} tone="bg-cesol-50 text-cesol-800" />
          <MetricCard label="Novos" value={filtered.filter((item) => item.status === 'novo').length} icon={Filter} tone="bg-amber-50 text-amber-800" />
          <MetricCard label="Concluídos" value={filtered.filter((item) => item.status === 'concluido').length} icon={PieChart} tone="bg-emerald-50 text-emerald-800" />
          <MetricCard label="Com Material Final" value={withFinalCount} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" />
        </div>

        {/* Painel de Filtros e Exportação */}
        <section className="panel mt-6 p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_160px_160px]">
            <div className="flex h-full items-end">
              <div className="flex w-full items-center gap-3 rounded-xl bg-stone-50 px-4 py-3 text-sm font-bold text-stone-600">
                <Filter size={18} /> Filtros do relatório
              </div>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">Trimestre</span>
              <Select value={trimestre} onChange={setTrimestre} options={trimestresOptions} />
            </label>
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

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-4">
            <div className="flex flex-wrap gap-2.5">
              <button
                className="btn-primary"
                onClick={() => void exportWithFeedback('pdf')}
                disabled={exportingPdf}
                type="button"
              >
                {exportingPdf ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                Exportar PDF (com Fotos)
              </button>
              <button
                className="btn-secondary"
                onClick={() => void exportWithFeedback('excel')}
                type="button"
              >
                <FileSpreadsheet size={18} /> Exportar Excel
              </button>
              <button
                className="btn-secondary"
                onClick={() => void exportWithFeedback('csv')}
                type="button"
              >
                <Download size={18} /> Exportar CSV
              </button>
            </div>

            <div className="text-xs text-stone-400">
              PDF inclui fotos e resumo • Excel/CSV incluem link de download
            </div>
          </div>
        </section>

        {/* Abas: Fotos dos Produtos vs Tabela */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
          <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-stone-950">Visualização de Resultados</h2>
              <p className="text-xs text-stone-500">
                {activeTab === 'fotos'
                  ? 'Galeria visual com as fotos e artes finais dos produtos enviados'
                  : 'Visão tabular completa de todos os registros'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {activeTab === 'fotos' && (
                <label className="flex items-center gap-2 text-xs font-bold text-stone-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-stone-300 text-cesol-600 focus:ring-cesol-500"
                    checked={onlyWithFinal}
                    onChange={(e) => setOnlyWithFinal(e.target.checked)}
                  />
                  Apenas com material final ({withFinalCount})
                </label>
              )}

              <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('fotos')}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200',
                    activeTab === 'fotos'
                      ? 'bg-white text-stone-950 shadow-sm border border-stone-200/50'
                      : 'text-stone-500 hover:text-stone-800'
                  )}
                >
                  <ImageIcon size={15} className="text-cesol-600" />
                  Fotos dos Produtos ({galleryItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tabela')}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200',
                    activeTab === 'tabela'
                      ? 'bg-white text-stone-950 shadow-sm border border-stone-200/50'
                      : 'text-stone-500 hover:text-stone-800'
                  )}
                >
                  <Table size={15} className="text-stone-500" />
                  Tabela Detalhada ({filtered.length})
                </button>
              </div>
            </div>
          </div>

          {/* Conteúdo da Aba: Fotos dos Produtos */}
          {activeTab === 'fotos' && (
            <div className="p-6">
              {galleryItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-200 p-12 text-center">
                  <ImageIcon className="mx-auto text-stone-300 mb-3" size={40} />
                  <p className="text-base font-bold text-stone-700">Nenhum produto encontrado com os filtros selecionados</p>
                  <p className="mt-1 text-xs text-stone-400">
                    {onlyWithFinal
                      ? 'Desmarque "Apenas com material final" ou altere os filtros acima.'
                      : 'Nenhum briefing corresponde aos filtros atuais.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {galleryItems.map((briefing) => {
                    const finalFiles = briefing.arquivos.filter((f) => f.is_final);
                    const primaryFile = finalFiles[0];
                    const servicoNome = briefing.servico === 'Outro' ? briefing.servico_outro || 'Outro' : briefing.servico;

                    return (
                      <div
                        key={briefing.id}
                        className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md hover:border-cesol-200"
                      >
                        <div>
                          {/* Card Top: Badges */}
                          <div className="flex items-center justify-between gap-2 border-b border-stone-100 bg-stone-50/60 p-3.5 text-xs">
                            <span className="font-bold text-cesol-800 truncate">{servicoNome}</span>
                            <StatusBadge status={briefing.status} />
                          </div>

                          {/* Image Box */}
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100 flex items-center justify-center p-2">
                            {primaryFile ? (
                              <>
                                <ProductImageThumb
                                  url={primaryFile.url}
                                  fileName={primaryFile.nome}
                                  className="h-full w-full"
                                  onClick={() =>
                                    setZoomItem({
                                      url: primaryFile.url,
                                      nome: primaryFile.nome,
                                      empreendimento: briefing.empreendimento,
                                      servico: servicoNome,
                                    })
                                  }
                                />
                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-stone-950/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setZoomItem({
                                        url: primaryFile.url,
                                        nome: primaryFile.nome,
                                        empreendimento: briefing.empreendimento,
                                        servico: servicoNome,
                                      })
                                    }
                                    className="rounded-full bg-white/90 p-2.5 text-stone-800 shadow transition hover:bg-white hover:scale-110"
                                    title="Visualizar em tamanho grande"
                                  >
                                    <ZoomIn size={18} />
                                  </button>
                                  <a
                                    href={primaryFile.url}
                                    download={primaryFile.nome}
                                    className="rounded-full bg-white/90 p-2.5 text-stone-800 shadow transition hover:bg-white hover:scale-110"
                                    title="Baixar material original"
                                  >
                                    <Download size={18} />
                                  </a>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-stone-400">
                                <ImageIcon size={32} className="text-stone-300" />
                                <span className="text-xs font-semibold">Aguardando material finalizado</span>
                              </div>
                            )}
                          </div>

                          {/* Info Area */}
                          <div className="p-4">
                            <h3 className="line-clamp-2 text-base font-black text-stone-900 leading-snug">
                              {briefing.empreendimento}
                            </h3>
                            <p className="mt-1 text-xs font-bold text-cesol-800">
                              Serviço: {servicoNome}
                            </p>
                          </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50/40 p-3 text-xs">
                          <Link
                            to={`/dashboard/briefings/${briefing.id}`}
                            className="inline-flex items-center gap-1 font-bold text-cesol-800 hover:text-cesol-900 transition"
                          >
                            Ver detalhes <ExternalLink size={13} />
                          </Link>

                          {primaryFile && (
                            <a
                              href={primaryFile.url}
                              download={primaryFile.nome}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-800 transition hover:bg-emerald-100"
                              title={primaryFile.nome}
                            >
                              <Download size={13} />
                              Baixar ({formatBytes(primaryFile.tamanho)})
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Aba: Tabela Completa */}
          {activeTab === 'tabela' && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-5 py-4">Empreendimento</th>
                    <th className="px-5 py-4">Trimestre</th>
                    <th className="px-5 py-4">Técnico</th>
                    <th className="px-5 py-4">Serviço</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Material Final</th>
                    <th className="px-5 py-4">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filtered.map((briefing) => {
                    const finalFiles = briefing.arquivos.filter((f) => f.is_final);
                    const primaryFinal = finalFiles[0];

                    return (
                      <tr key={briefing.id} className="hover:bg-stone-50/60 transition">
                        <td className="px-5 py-4">
                          <Link
                            to={`/dashboard/briefings/${briefing.id}`}
                            className="font-bold text-stone-950 hover:text-cesol-800 transition"
                          >
                            {briefing.empreendimento}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-stone-500">{briefing.trimestre || '-'}</td>
                        <td className="px-5 py-4 text-sm text-stone-600">{briefing.agente}</td>
                        <td className="px-5 py-4 text-sm text-stone-600">
                          {briefing.servico === 'Outro' ? briefing.servico_outro : briefing.servico}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={briefing.status} />
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {primaryFinal ? (
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                                <ProductImageThumb
                                  url={primaryFinal.url}
                                  fileName={primaryFinal.nome}
                                  className="h-full w-full"
                                  onClick={() =>
                                    setZoomItem({
                                      url: primaryFinal.url,
                                      nome: primaryFinal.nome,
                                      empreendimento: briefing.empreendimento,
                                      servico: briefing.servico === 'Outro' ? briefing.servico_outro || 'Outro' : briefing.servico,
                                    })
                                  }
                                />
                              </div>
                              <a
                                href={primaryFinal.url}
                                download={primaryFinal.nome}
                                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 hover:underline truncate max-w-[140px]"
                                title={`Baixar ${primaryFinal.nome}`}
                              >
                                <Download size={13} />
                                {primaryFinal.nome}
                              </a>
                            </div>
                          ) : (
                            <span className="text-stone-400">Pendente</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-stone-600">{formatDate(briefing.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Modal de Zoom da Foto do Produto */}
      {zoomItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
              <div>
                <h3 className="font-black text-stone-900 text-lg">{zoomItem.empreendimento}</h3>
                <p className="text-xs text-stone-500">
                  {zoomItem.servico} • {zoomItem.nome}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={zoomItem.url}
                  download={zoomItem.nome}
                  className="btn-primary !py-1.5 !px-3 text-xs"
                >
                  <Download size={15} /> Baixar
                </a>
                <button
                  type="button"
                  onClick={() => setZoomItem(null)}
                  className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content preview */}
            <div className="flex max-h-[70vh] items-center justify-center overflow-auto bg-stone-50 p-6">
              <ProductImageThumb
                url={zoomItem.url}
                fileName={zoomItem.nome}
                className="max-h-[65vh] max-w-full rounded-lg shadow-sm"
              />
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
        <option key={option} value={option}>
          {option.replace('_', ' ')}
        </option>
      ))}
    </select>
  );
}
