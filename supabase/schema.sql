-- Recall — Postgres schema for Supabase.
-- Run in the SQL editor, or `supabase db push` with these as a migration.
-- Review logs are APPEND-ONLY and are the source of truth for scheduler state.

create extension if not exists vector;
create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  scheduler text not null default 'fsrs6',        -- 'fsrs6' | 'sm2'
  fsrs_params jsonb,                                -- personalized weights (null => defaults)
  target_retention real not null default 0.90,
  max_interval int not null default 36500,
  daily_new_limit int not null default 20,
  daily_review_limit int not null default 200,
  timezone text,
  created_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text, author text, source_type text,       -- url|pdf|epub|text
  source_url text, storage_path text,
  status text not null default 'queued',            -- queued|processing|ready|failed
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  ordinal int not null,
  text text not null,
  provenance jsonb,                                 -- {page, section, char_start, char_end}
  embedding vector(1536)
);

create table if not exists decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists concepts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  summary text,
  layer text,                                       -- L1|L2|L3
  embedding vector(1536),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists concept_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  src_concept uuid not null references concepts(id) on delete cascade,
  dst_concept uuid not null references concepts(id) on delete cascade,
  relation text not null,                           -- is-a|causes|part-of|contrasts-with|prerequisite
  weight real default 1.0
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  deck_id uuid references decks(id) on delete set null,
  document_id uuid references documents(id) on delete set null,
  chunk_id uuid references document_chunks(id) on delete set null,
  type text not null,                               -- qa|cloze|conceptual|application|order|mcq
  layer text,                                       -- L1|L2|L3
  prompt text not null,
  answer text,
  payload jsonb,
  source_span jsonb,
  suspended boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists card_concepts (
  card_id uuid references cards(id) on delete cascade,
  concept_id uuid references concepts(id) on delete cascade,
  primary key (card_id, concept_id)
);

-- MATERIALIZED scheduler state (derived from review_logs; recomputed on sync).
create table if not exists card_states (
  card_id uuid primary key references cards(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  stability real,
  difficulty real,
  due timestamptz not null,
  last_review timestamptz,
  reps int default 0,
  lapses int default 0,
  state text not null default 'new',                -- new|learning|review|relearning
  updated_at timestamptz default now()
);

-- APPEND-ONLY source of truth.
create table if not exists review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  reviewed_at timestamptz not null,
  grade int not null check (grade between 1 and 4),
  elapsed_days real,
  scheduled_days real,
  pre_stability real, pre_difficulty real, pre_retrievability real,
  post_stability real, post_difficulty real,
  duration_ms int,
  scheduler text
);

create table if not exists device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  platform text not null,                           -- web|ios|macos
  token text not null,
  last_seen timestamptz default now(),
  unique (platform, token)
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  stage text not null,
  status text not null default 'pending',
  attempts int default 0,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_card_states_due on card_states(user_id, due);
create index if not exists idx_review_logs_replay on review_logs(user_id, card_id, reviewed_at);
create index if not exists idx_cards_user on cards(user_id) where deleted_at is null;

-- Row Level Security: each user sees only their own rows.
alter table profiles       enable row level security;
alter table documents      enable row level security;
alter table decks          enable row level security;
alter table concepts       enable row level security;
alter table concept_edges  enable row level security;
alter table cards          enable row level security;
alter table card_states    enable row level security;
alter table review_logs    enable row level security;
alter table device_tokens  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['documents','decks','concepts','concept_edges','cards','card_states','review_logs','device_tokens']
  loop
    execute format('create policy %I_owner on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid());', t, t);
  end loop;
end $$;

create policy profiles_owner on profiles for all using (id = auth.uid()) with check (id = auth.uid());
