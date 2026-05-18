import { Briefing, BriefingDraft, BriefingFile, BriefingStatus, Notification, Settings, User } from '../types';
import { validateAttachments } from '../utils/fileRules';

const USERS_KEY = 'cesolbrief:users';
const BRIEFINGS_KEY = 'cesolbrief:briefings';
const SETTINGS_KEY = 'cesolbrief:settings';
const NOTIFICATIONS_KEY = 'cesolbrief:notifications';

const defaultUsers: Array<User & { senha: string }> = [
  {
    id: 'admin-1',
    nome: 'Administrador CESOL',
    email: 'admin@cesol.br',
    senha: 'cesol123',
    isAdmin: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-1',
    nome: 'Técnico CESOL',
    email: 'tecnico@cesol.br',
    senha: 'cesol123',
    isAdmin: false,
    created_at: new Date().toISOString(),
  },
];

function read<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(key);
  return value ? (JSON.parse(value) as T) : fallback;
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function ensureSeed() {
  if (!localStorage.getItem(USERS_KEY)) write(USERS_KEY, defaultUsers);
  if (!localStorage.getItem(BRIEFINGS_KEY)) {
    const sample: Briefing[] = [
      {
        id: crypto.randomUUID(),
        agente: 'Wendel',
        tipo_servico: 'CRIAÇÃO',
        servico: 'Logotipo',
        empreendimento: 'Sabores da Serra',
        cidade: 'Jacobina',
        descricao: 'Criar identidade visual para empreendimento de alimentos artesanais com aplicação em redes sociais e etiqueta.',
        status: 'novo',
        situacao: 'ativo',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        user_id: 'user-1',
        arquivos: [],
        comentarios: [],
        historico: [{ id: crypto.randomUUID(), briefing_id: 'sample', texto: 'Briefing criado', created_at: new Date().toISOString() }],
      },
      {
        id: crypto.randomUUID(),
        agente: 'Andiara',
        tipo_servico: 'MELHORIA',
        servico: 'Rede Social',
        empreendimento: 'Ateliê Flor do Sertão',
        cidade: 'Caém',
        descricao: 'Melhorar cards de divulgação para campanha de Dia das Mães, mantendo as cores atuais da marca.',
        status: 'em_andamento',
        situacao: 'ativo',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        user_id: 'user-1',
        arquivos: [],
        comentarios: [],
        historico: [{ id: crypto.randomUUID(), briefing_id: 'sample2', texto: 'Status alterado para em andamento', created_at: new Date().toISOString() }],
      },
    ];
    write(BRIEFINGS_KEY, sample);
  }
  if (!localStorage.getItem(SETTINGS_KEY)) write<Settings>(SETTINGS_KEY, { briefingsPaused: false });
}

export async function login(email: string, senha: string): Promise<User> {
  ensureSeed();
  await delay(650);
  const users = read<Array<User & { senha: string }>>(USERS_KEY, defaultUsers);
  const found = users.find((user) => user.email.toLowerCase() === email.toLowerCase() && user.senha === senha);
  if (!found) throw new Error('E-mail ou senha inválidos.');
  return {
    id: found.id,
    nome: found.nome,
    email: found.email,
    isAdmin: found.isAdmin,
    created_at: found.created_at,
  };
}

export function getBriefings(user?: User | null) {
  ensureSeed();
  const briefings = read<Briefing[]>(BRIEFINGS_KEY, []);
  return user?.isAdmin ? briefings : briefings.filter((briefing) => briefing.user_id === user?.id);
}

export function getBriefing(id: string) {
  return read<Briefing[]>(BRIEFINGS_KEY, []).find((briefing) => briefing.id === id);
}

export async function createBriefing(draft: BriefingDraft, files: File[], user: User) {
  const attachmentError = validateAttachments(files);
  if (attachmentError) throw new Error(attachmentError);
  await delay(900);
  const briefingId = crypto.randomUUID();
  const arquivos: BriefingFile[] = files.map((file) => ({
    id: crypto.randomUUID(),
    briefing_id: briefingId,
    nome: file.name,
    url: URL.createObjectURL(file),
    tipo: file.type || 'application/octet-stream',
    tamanho: file.size,
  }));
  const briefing: Briefing = {
    ...draft,
    id: briefingId,
    status: 'novo',
    situacao: 'ativo',
    created_at: new Date().toISOString(),
    user_id: user.id,
    arquivos,
    comentarios: [],
    historico: [{ id: crypto.randomUUID(), briefing_id: briefingId, texto: 'Briefing criado', created_at: new Date().toISOString() }],
  };
  write(BRIEFINGS_KEY, [briefing, ...read<Briefing[]>(BRIEFINGS_KEY, [])]);
  addNotification({
    title: 'Novo briefing recebido',
    message: `${briefing.empreendimento} foi enviado por ${briefing.agente}.`,
    type: 'novo_briefing',
    briefing_id: briefing.id,
  });
  localStorage.removeItem('cesolbrief:draft');
  return briefing;
}

export function updateBriefingStatus(id: string, status: BriefingStatus) {
  const briefings = read<Briefing[]>(BRIEFINGS_KEY, []);
  const current = briefings.find((briefing) => briefing.id === id);
  write(
    BRIEFINGS_KEY,
    briefings.map((briefing) =>
      briefing.id === id
        ? {
            ...briefing,
            status,
            historico: [
              { id: crypto.randomUUID(), briefing_id: id, texto: `Status alterado para ${status}`, created_at: new Date().toISOString() },
              ...briefing.historico,
            ],
          }
        : briefing,
    ),
  );
  if (current && current.status !== 'concluido' && status === 'concluido') {
    addNotification({
      title: 'Briefing finalizado',
      message: `${current.empreendimento} foi marcado como concluído.`,
      type: 'briefing_concluido',
      briefing_id: current.id,
    });
  }
}

export function deleteBriefing(id: string) {
  write(
    BRIEFINGS_KEY,
    read<Briefing[]>(BRIEFINGS_KEY, []).filter((briefing) => briefing.id !== id),
  );
}

export function addComment(id: string, autor: string, texto: string) {
  const briefings = read<Briefing[]>(BRIEFINGS_KEY, []);
  write(
    BRIEFINGS_KEY,
    briefings.map((briefing) =>
      briefing.id === id
        ? {
            ...briefing,
            comentarios: [{ id: crypto.randomUUID(), briefing_id: id, autor, texto, created_at: new Date().toISOString() }, ...briefing.comentarios],
          }
        : briefing,
    ),
  );
}

export function getSettings() {
  ensureSeed();
  return read<Settings>(SETTINGS_KEY, { briefingsPaused: false });
}

export function setBriefingsPaused(briefingsPaused: boolean) {
  write<Settings>(SETTINGS_KEY, { briefingsPaused });
}

export function getNotifications() {
  ensureSeed();
  return read<Notification[]>(NOTIFICATIONS_KEY, []).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export function markNotificationsRead() {
  write(
    NOTIFICATIONS_KEY,
    read<Notification[]>(NOTIFICATIONS_KEY, []).map((notification) => ({ ...notification, read: true })),
  );
}

function addNotification(input: Omit<Notification, 'id' | 'read' | 'created_at'>) {
  const notification: Notification = {
    ...input,
    id: crypto.randomUUID(),
    read: false,
    created_at: new Date().toISOString(),
  };
  write(NOTIFICATIONS_KEY, [notification, ...read<Notification[]>(NOTIFICATIONS_KEY, [])].slice(0, 50));
  window.dispatchEvent(new CustomEvent('cesolbrief:notifications'));
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
