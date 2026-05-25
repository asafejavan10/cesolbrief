create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  "isAdmin" boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.briefings (
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
  created_at timestamptz not null default now(),
  user_id uuid references public.users(id) on delete set null
);

create table if not exists public.arquivos (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null references public.briefings(id) on delete cascade,
  nome text not null,
  url text not null,
  tipo text not null,
  tamanho bigint not null check (tamanho <= 5242880),
  created_at timestamptz not null default now()
);

create table if not exists public.briefing_comments (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null references public.briefings(id) on delete cascade,
  autor text not null,
  texto text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.briefing_history (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null references public.briefings(id) on delete cascade,
  texto text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null check (type in ('novo_briefing', 'briefing_concluido')),
  briefing_id uuid not null references public.briefings(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.settings (key, value)
values ('briefings_paused', '{"paused": false}'::jsonb)
on conflict (key) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'briefing-attachments',
  'briefing-attachments',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

alter table public.users enable row level security;
alter table public.briefings enable row level security;
alter table public.arquivos enable row level security;
alter table public.briefing_comments enable row level security;
alter table public.briefing_history enable row level security;
alter table public.settings enable row level security;
alter table public.notifications enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select "isAdmin" from public.users where id = auth.uid()), false);
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, nome, email, "isAdmin")
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create policy "Users can read own profile" on public.users
  for select using (id = auth.uid() or public.is_admin());

create policy "Users can insert own profile" on public.users
  for insert with check (id = auth.uid());

create policy "Users can read own briefings, admins read all" on public.briefings
  for select using (user_id = auth.uid() or public.is_admin());

create policy "Users can create own briefings" on public.briefings
  for insert with check (user_id = auth.uid());

create policy "Admins can update briefings" on public.briefings
  for update using (public.is_admin()) with check (public.is_admin());

create policy "Admins can delete briefings" on public.briefings
  for delete using (public.is_admin());

create policy "Files visible with briefing access" on public.arquivos
  for select using (
    exists (
      select 1 from public.briefings b
      where b.id = briefing_id and (b.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Users can insert files for own briefing" on public.arquivos
  for insert with check (
    exists (
      select 1 from public.briefings b
      where b.id = briefing_id and b.user_id = auth.uid()
    ) and tamanho <= 5242880
  );

create policy "Admins can read comments and history" on public.briefing_comments
  for select using (public.is_admin());

create policy "Admins can write comments" on public.briefing_comments
  for insert with check (public.is_admin());

create policy "History follows briefing access" on public.briefing_history
  for select using (
    exists (
      select 1 from public.briefings b
      where b.id = briefing_id and (b.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Admins can write history" on public.briefing_history
  for insert with check (public.is_admin());

create policy "Authenticated users can read settings" on public.settings
  for select using (auth.role() = 'authenticated');

create policy "Admins can update settings" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins can read notifications" on public.notifications
  for select using (public.is_admin());

create policy "Admins can manage notifications" on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Authenticated users can upload briefing attachments" on storage.objects
  for insert with check (
    bucket_id = 'briefing-attachments'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select id::text from public.briefings where user_id = auth.uid() or public.is_admin()
    )
  );

create policy "Authenticated users can read briefing attachments" on storage.objects
  for select using (
    bucket_id = 'briefing-attachments'
    and auth.role() = 'authenticated'
  );
