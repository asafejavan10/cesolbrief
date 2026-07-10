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

  const { data: profile, error: profileError } = await api
    .from('users')
    .select('id,nome,email,isAdmin,isBlocked,limitBriefings,created_at')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) {
    await api.auth.signOut();
    throw new Error('Perfil de usuário não encontrado. Se você foi removido recentemente ou se cadastrou sem perfil, fale com o administrador.');
  }
  if (profile.isBlocked) {
    await api.auth.signOut();
    throw new Error('Sua conta está bloqueada pelo administrador. Entre em contato com a administração.');
  }
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

export async function requestSupabasePasswordReset(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/redefinir-senha`;
  const { error } = await client().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(error.message);
}

export async function updateSupabasePassword(password: string): Promise<void> {
  const { error } = await client().auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await client().from('users').select('id,nome,email,isAdmin,isBlocked,limitBriefings,created_at').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as User[];
}

export async function setSupabaseUserRole(id: string, isAdmin: boolean): Promise<void> {
  const { error } = await client().from('users').update({ isAdmin }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getUserProfile(id: string): Promise<User> {
  const { data, error } = await client()
    .from('users')
    .select('id,nome,email,isAdmin,isBlocked,limitBriefings,created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Perfil de usuário não encontrado.');
  return data as User;
}

export async function updateSupabaseUserProfile(id: string, updates: { isAdmin?: boolean; isBlocked?: boolean; limitBriefings?: number | null }): Promise<void> {
  const { error } = await client().from('users').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function removeSupabaseUserProfile(id: string): Promise<void> {
  const { error } = await client().from('users').delete().eq('id', id);
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

  const { data: dbUser, error: userError } = await api.from('users').select('isBlocked,limitBriefings').eq('id', user.id).single();
  if (userError) throw new Error(userError.message);
  if (dbUser.isBlocked) throw new Error('Sua conta está bloqueada pelo administrador. Não é possível enviar novos briefings.');

  if (dbUser.limitBriefings !== null && dbUser.limitBriefings !== undefined) {
    const { count, error: countError } = await api.from('briefings').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    if (countError) throw new Error(countError.message);
    if (count !== null && count >= dbUser.limitBriefings) {
      throw new Error(`Limite de briefings atingido (${dbUser.limitBriefings} briefings).`);
    }
  }

  const { data: settings } = await api.from('settings').select('value').eq('key', 'briefings_paused').single();
  if (!user.isAdmin && settings?.value?.paused) throw new Error('O recebimento de briefings está pausado.');

  const activeQuarter = Number(settings?.value?.active_quarter ?? 8);
  const trimestreString = `${activeQuarter}º Trimestre/051.2024`;

  const { data: briefing, error } = await api
    .from('briefings')
    .insert({ ...draft, status: 'novo', situacao: 'ativo', user_id: user.id, trimestre: trimestreString })
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
  const { data: current } = await api.from('briefings').select('empreendimento,status,user_id').eq('id', id).single();
  const { error } = await api.from('briefings').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  await api.from('briefing_history').insert({ briefing_id: id, texto: `Status alterado para ${status}` });
  
  if (current?.status !== 'em_andamento' && status === 'em_andamento') {
    await api.from('notifications').insert({
      title: 'Briefing iniciado',
      message: `${current?.empreendimento || 'Briefing'} foi marcado como em andamento.`,
      type: 'briefing_iniciado',
      briefing_id: id,
    });
  }
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
  const api = client();
  const { error } = await api.from('briefing_comments').insert({ briefing_id: id, autor, texto });
  if (error) throw new Error(error.message);
}

export async function fetchSupabaseSettings(): Promise<Settings> {
  const { data, error } = await client().from('settings').select('value').eq('key', 'briefings_paused').single();
  if (error) throw new Error(error.message);
  return {
    briefingsPaused: Boolean(data?.value?.paused),
    activeQuarter: Number(data?.value?.active_quarter ?? 8),
    maxClosedQuarter: Number(data?.value?.max_closed_quarter ?? 7),
  };
}

export async function setSupabaseBriefingsPaused(briefingsPaused: boolean) {
  const api = client();
  const { data } = await api.from('settings').select('value').eq('key', 'briefings_paused').single();
  const current = data?.value || { active_quarter: 8, max_closed_quarter: 7 };
  const { error } = await api
    .from('settings')
    .upsert({
      key: 'briefings_paused',
      value: { ...current, paused: briefingsPaused },
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);
}

export async function closeSupabaseQuarter(quarterNumber: number) {
  const api = client();
  const { data } = await api.from('settings').select('value').eq('key', 'briefings_paused').single();
  const current = data?.value || { active_quarter: quarterNumber, max_closed_quarter: quarterNumber - 1 };
  const { error } = await api
    .from('settings')
    .upsert({
      key: 'briefings_paused',
      value: {
        ...current,
        paused: true,
        max_closed_quarter: quarterNumber,
      },
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);
}

export async function openSupabaseQuarter(quarterNumber: number) {
  const api = client();
  const { data } = await api.from('settings').select('value').eq('key', 'briefings_paused').single();
  const current = data?.value || { active_quarter: quarterNumber, max_closed_quarter: quarterNumber - 1 };
  const newMaxClosed = current.max_closed_quarter >= quarterNumber ? quarterNumber - 1 : current.max_closed_quarter;
  const { error } = await api
    .from('settings')
    .upsert({
      key: 'briefings_paused',
      value: {
        ...current,
        paused: false,
        active_quarter: quarterNumber,
        max_closed_quarter: newMaxClosed,
      },
      updated_at: new Date().toISOString(),
    });
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

export async function deleteSupabaseNotification(id: string) {
  const { error } = await client().from('notifications').delete().eq('id', id);
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
