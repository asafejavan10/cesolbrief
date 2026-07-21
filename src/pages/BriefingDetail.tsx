import { ArrowLeft, Download, MessageSquarePlus, Paperclip, Trash2, Upload, Loader2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useCallback, useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { addComment, getBriefing, updateBriefingStatus, uploadFinalFiles, removeFile } from '../services/dataProvider';
import { Briefing, BriefingStatus } from '../types';
import { cn } from '../utils/cn';
import { formatBytes, formatDate } from '../utils/format';


export function BriefingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [briefing, setBriefing] = useState<Briefing | null | undefined>(undefined);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    if (id) setBriefing(await getBriefing(id));
  }, [id]);

  async function handleUploadFinalFiles(files: FileList | null) {
    if (!files || files.length === 0 || !id) return;
    
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowedExtensions.includes(ext)) {
        toast.error(`Tipo de arquivo não permitido: ${file.name}. Envie apenas PDF, PNG ou JPG.`);
        return;
      }
      validFiles.push(file);
    }

    try {
      setUploading(true);
      await uploadFinalFiles(id, validFiles);
      toast.success('Material finalizado enviado com sucesso!');
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar os arquivos.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteFile(fileId: string) {
    if (!id) return;
    try {
      await removeFile(id, fileId);
      toast.success('Arquivo excluído com sucesso.');
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir o arquivo.');
    }
  }


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
            <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">
              <button
                type="button"
                onClick={() => void changeStatus('novo')}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200",
                  briefing.status === 'novo'
                    ? "bg-white text-amber-800 shadow-sm border border-stone-200/50"
                    : "text-stone-500 hover:text-stone-800"
                )}
              >
                Novo
              </button>
              <button
                type="button"
                onClick={() => void changeStatus('em_andamento')}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200",
                  briefing.status === 'em_andamento'
                    ? "bg-white text-blue-800 shadow-sm border border-stone-200/50"
                    : "text-stone-500 hover:text-stone-800"
                )}
              >
                Em andamento
              </button>
              <button
                type="button"
                onClick={() => void changeStatus('concluido')}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200",
                  briefing.status === 'concluido'
                    ? "bg-white text-emerald-800 shadow-sm border border-stone-200/50"
                    : "text-stone-500 hover:text-stone-800"
                )}
              >
                Concluído
              </button>
            </div>
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
              {briefing.arquivos.filter(f => !f.is_final).length === 0 ? (
                <p className="rounded-2xl bg-stone-50 p-5 text-sm font-semibold text-stone-500">Nenhum arquivo anexado.</p>
              ) : (
                briefing.arquivos.filter(f => !f.is_final).map((file) => (
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

          <div className="panel p-6 border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/10">
            <h2 className="text-xl font-black text-stone-950 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              Material Finalizado
            </h2>
            <p className="mt-1 text-xs text-stone-500">Arte final e arquivos finais para download (PDF, PNG, JPG)</p>
            
            <div className="mt-5 space-y-3">
              {briefing.arquivos.filter(f => f.is_final).length === 0 ? (
                <p className="rounded-2xl bg-stone-50/50 border border-dashed border-stone-200 p-5 text-sm font-semibold text-stone-500 text-center">
                  Nenhum material finalizado foi enviado ainda.
                </p>
              ) : (
                briefing.arquivos.filter(f => f.is_final).map((file) => (
                  <div key={file.id} className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm hover:bg-emerald-50/20">
                    <Paperclip className="text-emerald-600" size={20} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-stone-950">{file.nome}</p>
                      <p className="text-xs text-stone-500">{formatBytes(file.tamanho)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={file.url} download={file.nome} className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800" title="Baixar">
                        <Download size={18} />
                      </a>
                      {user?.isAdmin && (
                        <button type="button" onClick={() => void handleDeleteFile(file.id)} className="rounded-xl p-2 text-red-500 hover:bg-red-50" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {user?.isAdmin && (
              <div className="mt-5 border-t border-stone-100 pt-5">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-2xl p-5 hover:border-emerald-500 hover:bg-emerald-50/5 cursor-pointer transition-colors duration-200">
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-stone-500">
                      <Loader2 className="animate-spin text-emerald-600" size={24} />
                      <span className="text-xs font-bold">Enviando arquivos...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-stone-500">
                      <Upload className="text-stone-400 group-hover:text-emerald-500" size={24} />
                      <span className="text-xs font-bold text-stone-700">Enviar material finalizado</span>
                      <span className="text-[10px] text-stone-400">PDF, PNG, JPG (máx. 5MB)</span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    disabled={uploading}
                    onChange={(e) => void handleUploadFinalFiles(e.target.files)}
                  />
                </label>
              </div>
            )}
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
