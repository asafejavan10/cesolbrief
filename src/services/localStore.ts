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
    isBlocked: false,
    limitBriefings: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-1',
    nome: 'Técnico CESOL',
    email: 'tecnico@cesol.br',
    senha: 'cesol123',
    isAdmin: false,
    isBlocked: false,
    limitBriefings: null,
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
  if (!localStorage.getItem(SETTINGS_KEY)) write<Settings>(SETTINGS_KEY, { briefingsPaused: false, activeQuarter: 8, maxClosedQuarter: 7 });
}

export function getUsers() {
  ensureSeed();
  return read<Array<User & { senha: string }>>(USERS_KEY, defaultUsers).map((user) => ({
    id: user.id,
    nome: user.nome,
    email: user.email,
    isAdmin: user.isAdmin,
    isBlocked: user.isBlocked || false,
    limitBriefings: user.limitBriefings !== undefined ? user.limitBriefings : null,
    created_at: user.created_at,
  }));
}

export async function login(email: string, senha: string): Promise<User> {
  ensureSeed();
  await delay(650);
  const users = read<Array<User & { senha: string }>>(USERS_KEY, defaultUsers);
  const found = users.find((user) => user.email.toLowerCase() === email.toLowerCase() && user.senha === senha);
  if (!found) throw new Error('E-mail ou senha inválidos.');
  if (found.isBlocked) throw new Error('Sua conta está bloqueada pelo administrador. Entre em contato com a administração.');
  return {
    id: found.id,
    nome: found.nome,
    email: found.email,
    isAdmin: found.isAdmin,
    isBlocked: found.isBlocked || false,
    limitBriefings: found.limitBriefings !== undefined ? found.limitBriefings : null,
    created_at: found.created_at,
  };
}

export async function registerUser(nome: string, email: string, senha: string): Promise<void> {
  ensureSeed();
  await delay(650);
  const users = read<Array<User & { senha: string }>>(USERS_KEY, defaultUsers);
  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Este e-mail já está cadastrado.');
  }
  users.push({
    id: crypto.randomUUID(),
    nome,
    email,
    senha,
    isAdmin: email.toLowerCase() === 'ajavan.design@gmail.com',
    isBlocked: false,
    limitBriefings: null,
    created_at: new Date().toISOString(),
  });
  write(USERS_KEY, users);
}

export async function requestPasswordResetLocal(email: string): Promise<void> {
  ensureSeed();
  await delay(500);
  const users = read<Array<User & { senha: string }>>(USERS_KEY, defaultUsers);
  if (!users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('E-mail não encontrado.');
  }
}

export async function updatePasswordLocal(email: string, senha: string): Promise<void> {
  ensureSeed();
  await delay(500);
  const users = read<Array<User & { senha: string }>>(USERS_KEY, defaultUsers);
  write(
    USERS_KEY,
    users.map((user) => (user.email.toLowerCase() === email.toLowerCase() ? { ...user, senha } : user)),
  );
}

export async function getUserProfile(id: string): Promise<User> {
  ensureSeed();
  const users = read<Array<User & { senha: string }>>(USERS_KEY, defaultUsers);
  const found = users.find((u) => u.id === id);
  if (!found) throw new Error('Usuário não encontrado.');
  return {
    id: found.id,
    nome: found.nome,
    email: found.email,
    isAdmin: found.isAdmin,
    isBlocked: found.isBlocked || false,
    limitBriefings: found.limitBriefings !== undefined ? found.limitBriefings : null,
    created_at: found.created_at,
  };
}

export async function updateUserProfile(id: string, updates: Partial<User>): Promise<void> {
  ensureSeed();
  const users = read<Array<User & { senha: string }>>(USERS_KEY, defaultUsers);
  write(
    USERS_KEY,
    users.map((user) => (user.id === id ? { ...user, ...updates } : user)),
  );
}

export async function updateUserRole(id: string, isAdmin: boolean): Promise<void> {
  const users = read<Array<User & { senha: string }>>(USERS_KEY, defaultUsers);
  write(
    USERS_KEY,
    users.map((user) => (user.id === id ? { ...user, isAdmin } : user)),
  );
}

export async function removeUser(id: string): Promise<void> {
  const users = read<Array<User & { senha: string }>>(USERS_KEY, defaultUsers);
  write(
    USERS_KEY,
    users.filter((user) => user.id !== id),
  );
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

  const users = read<Array<User & { senha: string }>>(USERS_KEY, defaultUsers);
  const foundUser = users.find((u) => u.id === user.id);
  if (foundUser) {
    if (foundUser.isBlocked) {
      throw new Error('Sua conta está bloqueada pelo administrador. Não é possível enviar novos briefings.');
    }
    if (foundUser.limitBriefings !== null && foundUser.limitBriefings !== undefined) {
      const userBriefings = read<Briefing[]>(BRIEFINGS_KEY, []).filter((b) => b.user_id === user.id);
      if (userBriefings.length >= foundUser.limitBriefings) {
        throw new Error(`Limite de briefings atingido (${foundUser.limitBriefings} briefings).`);
      }
    }
  }

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
  const settings = getSettings();
  const activeQuarter = settings.activeQuarter || 8;
  const trimestreString = `${activeQuarter}º Trimestre/051.2024`;

  const briefing: Briefing = {
    ...draft,
    id: briefingId,
    status: 'novo',
    situacao: 'ativo',
    trimestre: trimestreString,
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

  if (current && current.status !== 'em_andamento' && status === 'em_andamento') {
    addNotification({
      title: 'Briefing iniciado',
      message: `${current.empreendimento} foi marcado como em andamento.`,
      type: 'briefing_iniciado',
      briefing_id: current.id,
    });
  }
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
  return read<Settings>(SETTINGS_KEY, { briefingsPaused: false, activeQuarter: 8, maxClosedQuarter: 7 });
}

export function setBriefingsPaused(briefingsPaused: boolean) {
  const current = getSettings();
  write<Settings>(SETTINGS_KEY, { ...current, briefingsPaused });
}

export function closeQuarter(quarterNumber: number) {
  const current = getSettings();
  write<Settings>(SETTINGS_KEY, {
    ...current,
    briefingsPaused: true,
    maxClosedQuarter: quarterNumber,
  });
}

export function openQuarter(quarterNumber: number) {
  const current = getSettings();
  const newMaxClosed = current.maxClosedQuarter >= quarterNumber ? quarterNumber - 1 : current.maxClosedQuarter;
  write<Settings>(SETTINGS_KEY, {
    ...current,
    briefingsPaused: false,
    activeQuarter: quarterNumber,
    maxClosedQuarter: newMaxClosed,
  });
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

export function deleteNotification(id: string) {
  write(
    NOTIFICATIONS_KEY,
    read<Notification[]>(NOTIFICATIONS_KEY, []).filter((notification) => notification.id !== id),
  );
  window.dispatchEvent(new CustomEvent('cesolbrief:notifications'));
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
