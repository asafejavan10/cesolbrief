create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  senha text not null,
  isAdmin boolean not null default false,
  isBlocked boolean not null default false,
  limitBriefings integer default null,
  created_at timestamptz not null default now()
);

create table if not exists briefings (
  id uuid primary key default gen_random_uuid(),
  agente text not null,
  tipo_servico text not null check (tipo_servico in ('CRIAÇÃO', 'MELHORIA')),
  servico text not null check (servico in ('Rotulagem', 'Logotipo', 'Rede Social', 'Outro')),
  servico_outro text,
  empreendimento text not null,
  cidade text not null,
  descricao text not null,
  status text not null default 'novo' check (status in ('novo', 'em_andamento', 'concluido')),
  situacao text not null default 'ativo',
  trimestre text,
  created_at timestamptz not null default now(),
  user_id uuid references users(id) on delete set null
);

create table if not exists arquivos (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null references briefings(id) on delete cascade,
  nome text not null,
  url text not null,
  tipo text not null,
  tamanho bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists briefing_comments (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null references briefings(id) on delete cascade,
  autor text not null,
  texto text not null,
  created_at timestamptz not null default now()
);

create table if not exists briefing_history (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null references briefings(id) on delete cascade,
  texto text not null,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null check (type in ('novo_briefing', 'briefing_iniciado', 'briefing_concluido')),
  briefing_id uuid not null references briefings(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications drop constraint if exists notifications_type_check;
alter table notifications
  add constraint notifications_type_check
  check (type in ('novo_briefing', 'briefing_iniciado', 'briefing_concluido'));

insert into settings (key, value)
values ('briefings_paused', '{"paused": false}'::jsonb)
on conflict (key) do nothing;
