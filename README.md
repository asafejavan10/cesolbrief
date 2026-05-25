# CesolBrief

Aplicação web para gerenciamento de briefings de design e comunicação do CESOL.

## Stack

- React + Vite + TypeScript
- TailwindCSS
- React Router
- Framer Motion
- Lucide React
- Serverless API em `api/`
- SQL em `database/schema.sql`
- Relatórios exportáveis em CSV, Excel e PDF
- Notificações de novo briefing e briefing concluído

## Desenvolvimento

```bash
npm install
npm run dev
```

No modo Supabase, usuários devem ser criados pelo fluxo `/cadastro` ou pelo painel do Supabase.
Contas criadas pelo app são sempre usuários comuns. Para promover alguém a administrador, altere `"isAdmin"` para `true` na tabela `public.users`.

## Produção

Configure as variáveis de ambiente:

- `DATABASE_URL`
- `JWT_SECRET`
- `BLOB_READ_WRITE_TOKEN`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_STORAGE_BUCKET`

## Supabase

Para usar Supabase, crie um projeto, habilite Authentication por e-mail/senha e execute `database/supabase.sql` no SQL Editor.

Depois, preencha `.env.local` com:

```bash
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-chave-anon-publica"
VITE_SUPABASE_STORAGE_BUCKET="briefing-attachments"
```

O arquivo `src/services/supabaseRepository.ts` já contém as operações para Auth, briefings, upload em Storage, relatórios, status e notificações.

Para promover um usuário a administrador:

```sql
update public.users
set "isAdmin" = true
where email = 'email-do-admin@exemplo.com';
```

## GitHub

O workflow `.github/workflows/ci.yml` roda em push e pull request:

- `npm ci`
- `npm run lint`
- `npm run build`

Execute o SQL de `database/schema.sql` no banco Postgres e publique em uma plataforma compatível com funções serverless, como Vercel.
