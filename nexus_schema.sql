create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  plan_name text default 'Plano Free',
  credits integer default 0,
  created_at timestamptz default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  title text,
  mode text default 'chat',
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  project_type text not null,
  title text,
  prompt text,
  result_text text,
  created_at timestamptz default now()
);