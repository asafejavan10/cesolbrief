export type Role = 'user' | 'admin';

export type User = {
  id: string;
  nome: string;
  email: string;
  isAdmin: boolean;
  created_at: string;
};

export type BriefingStatus = 'novo' | 'em_andamento' | 'concluido';
export type BriefingSituation = 'ativo' | 'pausado' | 'arquivado';
export type ServiceType = 'CRIAÇÃO' | 'MELHORIA';
export type ServiceName = 'Rotulagem' | 'Logotipo' | 'Rede Social' | 'Outro';

export type BriefingFile = {
  id: string;
  briefing_id: string;
  nome: string;
  url: string;
  tipo: string;
  tamanho: number;
};

export type BriefingComment = {
  id: string;
  briefing_id: string;
  autor: string;
  texto: string;
  created_at: string;
};

export type BriefingHistory = {
  id: string;
  briefing_id: string;
  texto: string;
  created_at: string;
};

export type Briefing = {
  id: string;
  agente: string;
  tipo_servico: ServiceType;
  servico: ServiceName;
  servico_outro?: string;
  empreendimento: string;
  cidade: string;
  descricao: string;
  status: BriefingStatus;
  situacao: BriefingSituation;
  created_at: string;
  user_id: string;
  arquivos: BriefingFile[];
  comentarios: BriefingComment[];
  historico: BriefingHistory[];
};

export type BriefingDraft = Pick<
  Briefing,
  'agente' | 'tipo_servico' | 'servico' | 'servico_outro' | 'empreendimento' | 'cidade' | 'descricao'
>;

export type Settings = {
  briefingsPaused: boolean;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'novo_briefing' | 'briefing_iniciado' | 'briefing_concluido';
  briefing_id: string;
  read: boolean;
  created_at: string;
};
