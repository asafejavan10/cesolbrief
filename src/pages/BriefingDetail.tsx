import { ArrowLeft, Download, MessageSquarePlus, Paperclip } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useCallback, useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { addComment, getBriefing, updateBriefingStatus } from '../services/dataProvider';
import { Briefing, BriefingStatus } from '../types';
import { formatBytes, formatDate } from '../utils/format';

export function BriefingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [briefing, setBriefing] = useState<Briefing | null | undefined>(undefined);
  const [comment, setComment] = useState('');

  const refresh = useCallback(async () => {
    if (id) setBriefing(await getBriefing(id));
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim() || !id || !user) return;
    await addComment(id, user.nome, comment);
    setComment('');
    await refresh();
    toast.success('Comentário interno adicionado.');
  }

  async function changeStatus(status: BriefingStatus) {
    if (!briefing) return;
    await updateBriefingStatus(briefing.id, status);
    if (status === 'concluido') {
      toast.success('Briefing finalizado.');
      navigate('/dashboard');
      return;
    }
    await refresh();
  }

  if (briefing === undefined) return <DashboardLayout><div className="p-8 text-sm font-semibold text-stone-500">Carregando briefing...</div></DashboardLayout>;
  if (!briefing) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <div className="border-b border-stone-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-cesol-800"><ArrowLeft size={17} /> Voltar</Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-stone-950">{briefing.empreendimento}</h1>
            <p className="mt-2 text-sm text-stone-500">Criado em {formatDate(briefing.created_at)} por {briefing.agente}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={briefing.status} />
            <select className="input w-auto" value={briefing.status} onChange={(event) => { void changeStatus(event.target.value as BriefingStatus); }}>
              <option value="novo">novo</option>
              <option value="em_andamento">em andamento</option>
              <option value="concluido">concluído</option>
            </select>
          </div>
        </div>
      </div>
      <main className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <section className="space-y-6">
          <div className="panel p-6">
            <h2 className="text-xl font-black text-stone-950">Respostas do formulário</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Info label="Técnico responsável" value={briefing.agente} />
              <Info label="Tipo de serviço" value={briefing.tipo_servico} />
              <Info label="Serviço solicitado" value={briefing.servico === 'Outro' ? briefing.servico_outro || 'Outro' : briefing.servico} />
              <Info label="Cidade" value={briefing.cidade} />
            </div>
            <div className="mt-5 rounded-2xl bg-stone-50 p-5">
              <p className="text-sm font-bold text-stone-500">Descrição detalhada</p>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-stone-800">{briefing.descricao}</p>
            </div>
          </div>
          <div className="panel p-6">
            <h2 className="text-xl font-black text-stone-950">Arquivos anexados</h2>
            <div className="mt-5 space-y-3">
              {briefing.arquivos.length === 0 ? (
                <p className="rounded-2xl bg-stone-50 p-5 text-sm font-semibold text-stone-500">Nenhum arquivo anexado.</p>
              ) : (
                briefing.arquivos.map((file) => (
                  <a key={file.id} href={file.url} download={file.nome} className="flex items-center gap-3 rounded-2xl border border-stone-200 p-4 hover:bg-stone-50">
                    <Paperclip className="text-cesol-800" size={20} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-stone-950">{file.nome}</p>
                      <p className="text-xs text-stone-500">{formatBytes(file.tamanho)}</p>
                    </div>
                    <Download size={18} />
                  </a>
                ))
              )}
            </div>
          </div>
        </section>
        <aside className="space-y-6">
          <div className="panel p-6">
            <h2 className="text-xl font-black text-stone-950">Comentários internos</h2>
            <form className="mt-4" onSubmit={submitComment}>
              <textarea className="input min-h-28 resize-none" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Adicionar observação para equipe..." />
              <button className="btn-primary mt-3 w-full" type="submit"><MessageSquarePlus size={18} /> Comentar</button>
            </form>
            <div className="mt-5 space-y-3">
              {briefing.comentarios.map((item) => (
                <div key={item.id} className="rounded-2xl bg-stone-50 p-4">
                  <p className="text-sm font-bold text-stone-950">{item.autor}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{item.texto}</p>
                  <p className="mt-2 text-xs text-stone-400">{formatDate(item.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="panel p-6">
            <h2 className="text-xl font-black text-stone-950">Histórico</h2>
            <div className="mt-5 space-y-4">
              {briefing.historico.map((item) => (
                <div key={item.id} className="border-l-2 border-cesol-300 pl-4">
                  <p className="text-sm font-bold text-stone-800">{item.texto}</p>
                  <p className="mt-1 text-xs text-stone-500">{formatDate(item.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </DashboardLayout>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <p className="text-xs font-bold uppercase text-stone-500">{label}</p>
      <p className="mt-2 font-bold text-stone-950">{value || '-'}</p>
    </div>
  );
}
