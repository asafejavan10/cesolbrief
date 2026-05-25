import { Briefing, BriefingDraft, BriefingFile, BriefingStatus, Notification, Settings, User } from '../types';
import { validateAttachments } from '../utils/fileRules';
import { supabase, supabaseBucket } from './supabaseClient';

function client() {
  if (!supabase) throw new Error('Supabase não configurado. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  return supabase;
}

export async function signInWithSupabase(email: string, password: string): Promise<User> {
  const api = client();
  const { data, error } = await api.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(error?.message || 'Falha ao autenticar no Supabase.');

  const { data: profile, error: profileError } = await api.from('users').select('id,nome,email,isAdmin,created_at').eq('id', data.user.id).single();
  if (profileError) throw new Error(profileError.message);
  return profile as User;
}

export async function signUpWithSupabase(nome: string, email: string, password: string): Promise<void> {
  const api = client();
  const { error } = await api.auth.signUp({
    email,
    password,
    options: {
      data: { nome },
    },
  });
  if (error) throw new Error(error.message);
}

export async function signOutSupabase() {
  const { error } = await client().auth.signOut();
  if (error) throw new Error(error.message);
}

export async function fetchBriefings(user: User): Promise<Briefing[]> {
  const query = client()
    .from('briefings')
    .select('*, arquivos(*), comentarios:briefing_comments(*), historico:briefing_history(*)')
    .order('created_at', { ascending: false });

  const { data, error } = user.isAdmin ? await query : await query.eq('user_id', user.id);
  if (error) throw new Error(error.message);
  return (data || []) as Briefing[];
}

export async function fetchBriefing(id: string): Promise<Briefing | null> {
  const { data, error } = await client()
    .from('briefings')
    .select('*, arquivos(*), comentarios:briefing_comments(*), historico:briefing_history(*)')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as Briefing;
}

export async function insertBriefing(draft: BriefingDraft, files: File[], user: User): Promise<Briefing> {
  const attachmentError = validateAttachments(files);
  if (attachmentError) throw new Error(attachmentError);

  const api = client();
  const { data: settings } = await api.from('settings').select('value').eq('key', 'briefings_paused').single();
  if (!user.isAdmin && settings?.value?.paused) throw new Error('O recebimento de briefings está pausado.');

  const { data: briefing, error } = await api
    .from('briefings')
    .insert({ ...draft, status: 'novo', situacao: 'ativo', user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const uploadedFiles = await uploadBriefingFiles(briefing.id, files);
  if (uploadedFiles.length) {
    const { error: filesError } = await api.from('arquivos').insert(uploadedFiles);
    if (filesError) throw new Error(filesError.message);
  }

  await api.from('briefing_history').insert({ briefing_id: briefing.id, texto: 'Briefing criado' });
  await api.from('notifications').insert({
    title: 'Novo briefing recebido',
    message: `${briefing.empreendimento} foi enviado por ${briefing.agente}.`,
    type: 'novo_briefing',
    briefing_id: briefing.id,
  });

  return { ...(briefing as Briefing), arquivos: uploadedFiles, comentarios: [], historico: [] };
}

export async function setSupabaseBriefingStatus(id: string, status: BriefingStatus) {
  const api = client();
  const { data: current } = await api.from('briefings').select('empreendimento,status').eq('id', id).single();
  const { error } = await api.from('briefings').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  await api.from('briefing_history').insert({ briefing_id: id, texto: `Status alterado para ${status}` });
  if (current?.status !== 'concluido' && status === 'concluido') {
    await api.from('notifications').insert({
      title: 'Briefing finalizado',
      message: `${current?.empreendimento || 'Briefing'} foi marcado como concluído.`,
      type: 'briefing_concluido',
      briefing_id: id,
    });
  }
}

export async function removeSupabaseBriefing(id: string) {
  const { error } = await client().from('briefings').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function insertSupabaseComment(id: string, autor: string, texto: string) {
  const { error } = await client().from('briefing_comments').insert({ briefing_id: id, autor, texto });
  if (error) throw new Error(error.message);
}

export async function fetchSupabaseSettings(): Promise<Settings> {
  const { data, error } = await client().from('settings').select('value').eq('key', 'briefings_paused').single();
  if (error) throw new Error(error.message);
  return { briefingsPaused: Boolean(data?.value?.paused) };
}

export async function setSupabaseBriefingsPaused(briefingsPaused: boolean) {
  const { error } = await client()
    .from('settings')
    .upsert({ key: 'briefings_paused', value: { paused: briefingsPaused }, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function fetchSupabaseNotifications(): Promise<Notification[]> {
  const { data, error } = await client().from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) throw new Error(error.message);
  return (data || []) as Notification[];
}

export async function markSupabaseNotificationsRead() {
  const { error } = await client().from('notifications').update({ read: true }).eq('read', false);
  if (error) throw new Error(error.message);
}

async function uploadBriefingFiles(briefingId: string, files: File[]): Promise<BriefingFile[]> {
  const api = client();
  const uploaded: BriefingFile[] = [];

  for (const file of files) {
    const extension = file.name.split('.').pop();
    const path = `${briefingId}/${crypto.randomUUID()}${extension ? `.${extension}` : ''}`;
    const { data, error } = await api.storage.from(supabaseBucket).upload(path, file, {
      cacheControl: '3600',
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
    if (error) throw new Error(error.message);
    const { data: publicUrl } = api.storage.from(supabaseBucket).getPublicUrl(data.path);
    uploaded.push({
      id: crypto.randomUUID(),
      briefing_id: briefingId,
      nome: file.name,
      url: publicUrl.publicUrl,
      tipo: file.type || 'application/octet-stream',
      tamanho: file.size,
    });
  }

  return uploaded;
}
