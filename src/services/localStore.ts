import { Briefing, BriefingDraft, BriefingFile, BriefingStatus, Notification, Settings, User } from '../types';
import { validateAttachments, validateFinalFiles } from '../utils/fileRules';

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
    avatar_url: null,
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
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-2',
    nome: 'Wendel',
    email: 'wendel@cesol.br',
    senha: 'cesol123',
    isAdmin: false,
    isBlocked: false,
    limitBriefings: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-3',
    nome: 'Andiara',
    email: 'andiara@cesol.br',
    senha: 'cesol123',
    isAdmin: false,
    isBlocked: false,
    limitBriefings: null,
    avatar_url: null,
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

const melRotuloSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2378350f"/><stop offset="50%" stop-color="%23b45309"/><stop offset="100%" stop-color="%23d97706"/></linearGradient><linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23fbbf24"/><stop offset="50%" stop-color="%23fef08a"/><stop offset="100%" stop-color="%23f59e0b"/></linearGradient></defs><rect width="800" height="500" rx="20" fill="url(%23bg)"/><rect x="25" y="25" width="750" height="450" rx="15" fill="none" stroke="url(%23gold)" stroke-width="4" stroke-dasharray="12,6"/><g opacity="0.15" fill="none" stroke="%23fef08a" stroke-width="2"><polygon points="100,60 120,70 120,90 100,100 80,90 80,70"/><polygon points="140,60 160,70 160,90 140,100 120,90 120,70"/><polygon points="700,60 720,70 720,90 700,100 680,90 680,70"/></g><text x="400" y="110" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="%23fde68a" text-anchor="middle" letter-spacing="4">PRODUTO ARTESANAL DA BAHIA</text><text x="400" y="180" font-family="Georgia, serif" font-size="46" font-weight="bold" fill="%23ffffff" text-anchor="middle">MEL SILVESTRE</text><text x="400" y="220" font-family="Arial, sans-serif" font-size="22" font-style="italic" fill="url(%23gold)" text-anchor="middle">100% Puro • Florada Nativa da Chapada</text><circle cx="400" cy="300" r="55" fill="%23451a03" stroke="url(%23gold)" stroke-width="3"/><text x="400" y="295" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="%23fbbf24" text-anchor="middle">500g</text><text x="400" y="322" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%23fde68a" text-anchor="middle">PESO LÍQUIDO</text><text x="100" y="380" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="%23ffffff">Cooperativa Apícola Chapada Norte</text><text x="100" y="405" font-family="Arial, sans-serif" font-size="12" fill="%23fde68a">Jacobina - Bahia • Brasil</text><text x="100" y="430" font-family="Arial, sans-serif" font-size="11" fill="%23fde68a">Reg. CESOL: 051.2024</text><rect x="560" y="350" width="160" height="90" rx="8" fill="%23451a03" opacity="0.8" stroke="%23fbbf24" stroke-width="1.5"/><text x="640" y="375" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%23fbbf24" text-anchor="middle">AGRICULTURA FAMILIAR</text><text x="640" y="398" font-family="Arial, sans-serif" font-size="10" fill="%23ffffff" text-anchor="middle">Sem Conservantes</text><text x="640" y="420" font-family="Arial, sans-serif" font-size="10" fill="%23fde68a" text-anchor="middle">Lote: 0824 • Val: 24M</text></svg>`;

const cafeRotuloSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500"><defs><linearGradient id="cbg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2314532d"/><stop offset="50%" stop-color="%23064e3b"/><stop offset="100%" stop-color="%23022c22"/></linearGradient><linearGradient id="cgold" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="50%" stop-color="%23fde68a"/><stop offset="100%" stop-color="%23d97706"/></linearGradient></defs><rect width="800" height="500" rx="20" fill="url(%23cbg)"/><rect x="25" y="25" width="750" height="450" rx="15" fill="none" stroke="url(%23cgold)" stroke-width="4" stroke-dasharray="8,4"/><text x="400" y="110" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="%23fef08a" text-anchor="middle" letter-spacing="4">GRÃOS SELECIONADOS • ALTA MOGIANA</text><text x="400" y="180" font-family="Georgia, serif" font-size="46" font-weight="bold" fill="%23ffffff" text-anchor="middle">CAFÉ DA CHAPADA</text><text x="400" y="220" font-family="Arial, sans-serif" font-size="22" font-style="italic" fill="url(%23cgold)" text-anchor="middle">Especial Gourmet • 100% Arábica</text><circle cx="400" cy="300" r="55" fill="%23022c22" stroke="url(%23cgold)" stroke-width="3"/><text x="400" y="295" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="%23fbbf24" text-anchor="middle">250g</text><text x="400" y="322" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%23fde68a" text-anchor="middle">TORRADO E MOÍDO</text><text x="100" y="380" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="%23ffffff">Assoc. Produtores de Café</text><text x="100" y="405" font-family="Arial, sans-serif" font-size="12" fill="%23bbf7d0">Caém - Bahia • Brasil</text><text x="100" y="430" font-family="Arial, sans-serif" font-size="11" fill="%23bbf7d0">Altitude: 950m • Peneira 16 acima</text><rect x="560" y="350" width="160" height="90" rx="8" fill="%23022c22" opacity="0.8" stroke="%23fbbf24" stroke-width="1.5"/><text x="640" y="375" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="%23fbbf24" text-anchor="middle">TORRA MÉDIA</text><text x="640" y="398" font-family="Arial, sans-serif" font-size="10" fill="%23ffffff" text-anchor="middle">Notas de Chocolate e Caramelo</text><text x="640" y="420" font-family="Arial, sans-serif" font-size="10" fill="%23bbf7d0" text-anchor="middle">Pontuação SCA: 84 pts</text></svg>`;

export function ensureSeed() {
  if (!localStorage.getItem(USERS_KEY)) write(USERS_KEY, defaultUsers);
  
  const currentBriefings = read<Briefing[]>(BRIEFINGS_KEY, []);
  const hasRotulagem = currentBriefings.some((b) => b.servico === 'Rotulagem' && b.arquivos.some((f) => f.is_final));

  if (!hasRotulagem) {
    const rotulagemMock1: Briefing = {
      id: 'mock-rotulagem-mel',
      agente: 'Wendel',
      tipo_servico: 'CRIAÇÃO',
      servico: 'Rotulagem',
      empreendimento: 'Cooperativa Apícola Chapada Norte',
      cidade: 'Jacobina',
      descricao: 'Desenvolvimento de rótulo para pote de vidro de 500g de Mel Silvestre Orgânico. O rótulo contém tabela nutricional, selo da agricultura familiar e espaço para lote e validade.',
      status: 'concluido',
      situacao: 'ativo',
      trimestre: '8º Trimestre/051.2024',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      user_id: 'user-2',
      arquivos: [
        {
          id: 'mock-file-final-mel',
          briefing_id: 'mock-rotulagem-mel',
          nome: 'rotulo_mel_silvestre_500g.svg',
          url: melRotuloSvg,
          tipo: 'image/svg+xml',
          tamanho: 24500,
          is_final: true,
        },
      ],
      comentarios: [
        {
          id: 'mock-c1',
          briefing_id: 'mock-rotulagem-mel',
          autor: 'Administrador CESOL',
          texto: 'Arte final do rótulo enviada e aprovada para produção gráfica.',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
      ],
      historico: [
        { id: 'mock-h3', briefing_id: 'mock-rotulagem-mel', texto: 'Briefing finalizado', created_at: new Date(Date.now() - 3600000 * 20).toISOString() },
        { id: 'mock-h2', briefing_id: 'mock-rotulagem-mel', texto: 'Material finalizado enviado', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
        { id: 'mock-h1', briefing_id: 'mock-rotulagem-mel', texto: 'Briefing criado', created_at: new Date(Date.now() - 3600000 * 48).toISOString() },
      ],
    };

    const rotulagemMock2: Briefing = {
      id: 'mock-rotulagem-cafe',
      agente: 'Andiara',
      tipo_servico: 'CRIAÇÃO',
      servico: 'Rotulagem',
      empreendimento: 'Café da Chapada Gourmet',
      cidade: 'Caém',
      descricao: 'Criação de embalagem e rótulo frontal para Café Especial em grãos torrado e moído 250g. Rótulo com selo de torra e notas sensoriais.',
      status: 'concluido',
      situacao: 'ativo',
      trimestre: '8º Trimestre/051.2024',
      created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
      user_id: 'user-3',
      arquivos: [
        {
          id: 'mock-file-final-cafe',
          briefing_id: 'mock-rotulagem-cafe',
          nome: 'rotulo_cafe_especial_250g.svg',
          url: cafeRotuloSvg,
          tipo: 'image/svg+xml',
          tamanho: 26800,
          is_final: true,
        },
      ],
      comentarios: [],
      historico: [
        { id: 'mock-hc2', briefing_id: 'mock-rotulagem-cafe', texto: 'Material finalizado enviado', created_at: new Date(Date.now() - 3600000 * 30).toISOString() },
        { id: 'mock-hc1', briefing_id: 'mock-rotulagem-cafe', texto: 'Briefing criado', created_at: new Date(Date.now() - 3600000 * 72).toISOString() },
      ],
    };

    const baseBriefings = currentBriefings.length > 0 ? currentBriefings : [
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
        trimestre: '8º Trimestre/051.2024',
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
        trimestre: '8º Trimestre/051.2024',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        user_id: 'user-1',
        arquivos: [],
        comentarios: [],
        historico: [{ id: crypto.randomUUID(), briefing_id: 'sample2', texto: 'Status alterado para em andamento', created_at: new Date().toISOString() }],
      },
    ];

    write(BRIEFINGS_KEY, [rotulagemMock1, rotulagemMock2, ...baseBriefings]);
  }
  if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
    const briefings = read<Briefing[]>(BRIEFINGS_KEY, []);
    const sampleNotification: Notification[] = [
      {
        id: crypto.randomUUID(),
        title: 'Novo briefing recebido',
        message: 'Sabores da Serra foi enviado por Wendel.',
        type: 'novo_briefing',
        briefing_id: briefings[0]?.id || '',
        read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
    write(NOTIFICATIONS_KEY, sampleNotification);
  }
  if (!localStorage.getItem(SETTINGS_KEY)) write<Settings>(SETTINGS_KEY, { briefingsPaused: false, activeQuarter: 8, maxClosedQuarter: 7, createdQuarters: [8] });
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
    avatar_url: user.avatar_url || null,
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
    avatar_url: found.avatar_url || null,
    created_at: found.created_at,
  };
}

export async function registerUser(nome: string, email: string, senha: string): Promise<void> {
  ensureSeed();
  await delay(500);
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
    avatar_url: null,
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
    avatar_url: found.avatar_url || null,
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

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  ensureSeed();
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('A foto de perfil deve ter no máximo 2MB.');
  }
  const mime = file.type.toLowerCase();
  if (mime !== 'image/jpeg' && mime !== 'image/png' && mime !== 'image/jpg') {
    throw new Error('Apenas imagens nos formatos JPG ou PNG são permitidas.');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao ler a imagem selecionada.'));
    reader.readAsDataURL(file);
  });

  await updateUserProfile(userId, { avatar_url: dataUrl });
  return dataUrl;
}

export async function removeUserAvatar(userId: string): Promise<void> {
  await updateUserProfile(userId, { avatar_url: null });
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

export async function updateBriefing(
  id: string,
  draft: BriefingDraft,
  newFiles: File[],
  filesToRemove: string[]
): Promise<Briefing> {
  const briefings = read<Briefing[]>(BRIEFINGS_KEY, []);
  const index = briefings.findIndex((b) => b.id === id);
  if (index === -1) throw new Error('Briefing não encontrado.');

  const existingBriefing = briefings[index];

  const attachmentError = validateAttachments(newFiles);
  if (attachmentError) throw new Error(attachmentError);

  // Filter out removed files
  let updatedFiles = existingBriefing.arquivos.filter((file) => !filesToRemove.includes(file.id));

  // Add new files
  const newlyUploadedFiles: BriefingFile[] = newFiles.map((file) => ({
    id: crypto.randomUUID(),
    briefing_id: id,
    nome: file.name,
    url: URL.createObjectURL(file),
    tipo: file.type || 'application/octet-stream',
    tamanho: file.size,
  }));
  updatedFiles = [...updatedFiles, ...newlyUploadedFiles];

  const updatedBriefing: Briefing = {
    ...existingBriefing,
    ...draft,
    arquivos: updatedFiles,
    historico: [
      { id: crypto.randomUUID(), briefing_id: id, texto: 'Briefing editado', created_at: new Date().toISOString() },
      ...existingBriefing.historico,
    ],
  };

  briefings[index] = updatedBriefing;
  write(BRIEFINGS_KEY, briefings);

  return updatedBriefing;
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
  const saved = read<Settings>(SETTINGS_KEY, { briefingsPaused: false, activeQuarter: 8, maxClosedQuarter: 7, createdQuarters: [8] });
  if (!saved.createdQuarters || saved.createdQuarters.length === 0) {
    saved.createdQuarters = [saved.activeQuarter || 8];
  }
  return saved;
}

export function setBriefingsPaused(briefingsPaused: boolean) {
  const current = getSettings();
  write<Settings>(SETTINGS_KEY, { ...current, briefingsPaused });
}

export function closeQuarter(quarterNumber: number) {
  const current = getSettings();
  const createdQuarters = Array.from(new Set([...(current.createdQuarters || [current.activeQuarter]), quarterNumber]));
  write<Settings>(SETTINGS_KEY, {
    ...current,
    briefingsPaused: true,
    maxClosedQuarter: quarterNumber,
    createdQuarters,
  });
}

export function openQuarter(quarterNumber: number) {
  const current = getSettings();
  const createdQuarters = Array.from(new Set([...(current.createdQuarters || [current.activeQuarter]), quarterNumber]));
  const newMaxClosed = current.maxClosedQuarter >= quarterNumber ? quarterNumber - 1 : current.maxClosedQuarter;
  write<Settings>(SETTINGS_KEY, {
    ...current,
    briefingsPaused: false,
    activeQuarter: quarterNumber,
    maxClosedQuarter: newMaxClosed,
    createdQuarters,
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

export async function uploadFinalFiles(briefingId: string, files: File[]): Promise<BriefingFile[]> {
  const validationError = validateFinalFiles(files);
  if (validationError) throw new Error(validationError);
  ensureSeed();
  await delay(800);
  const briefings = read<Briefing[]>(BRIEFINGS_KEY, []);
  const index = briefings.findIndex((b) => b.id === briefingId);
  if (index === -1) throw new Error('Briefing não encontrado.');

  const newlyUploadedFiles: BriefingFile[] = files.map((file) => ({
    id: crypto.randomUUID(),
    briefing_id: briefingId,
    nome: file.name,
    url: URL.createObjectURL(file),
    tipo: file.type || (file.name.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream'),
    tamanho: file.size,
    is_final: true,
  }));

  briefings[index].arquivos = [...briefings[index].arquivos, ...newlyUploadedFiles];
  briefings[index].historico = [
    { id: crypto.randomUUID(), briefing_id: briefingId, texto: 'Material finalizado enviado', created_at: new Date().toISOString() },
    ...briefings[index].historico,
  ];

  write(BRIEFINGS_KEY, briefings);
  return newlyUploadedFiles;
}

export async function removeFile(briefingId: string, fileId: string): Promise<void> {
  ensureSeed();
  await delay(400);
  const briefings = read<Briefing[]>(BRIEFINGS_KEY, []);
  const index = briefings.findIndex((b) => b.id === briefingId);
  if (index === -1) return;

  briefings[index].arquivos = briefings[index].arquivos.filter((file) => file.id !== fileId);
  briefings[index].historico = [
    { id: crypto.randomUUID(), briefing_id: briefingId, texto: 'Arquivo excluído', created_at: new Date().toISOString() },
    ...briefings[index].historico,
  ];

  write(BRIEFINGS_KEY, briefings);
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
