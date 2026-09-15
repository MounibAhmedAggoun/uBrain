-- uBrain Supabase schema
-- Run this whole file in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).
-- This creates the 4 tables that src/lib/cloud.ts expects to exist.
--
-- Note on ID types: the app generates its own IDs client-side, shaped like
-- "roadmap-<uuid>" or "node-<uuid>" (see src/store/useRoadmapStore.ts), not bare UUIDs.
-- So roadmap/node reference columns below are `text`, not `uuid`. Only owner_id and
-- author_id are real UUIDs, because those come from Supabase Auth.
--
-- Row Level Security (RLS) is NOT enabled yet on purpose — that's the next step,
-- done separately, after we confirm these tables work.

-- 1. roadmaps: one row per saved roadmap, owned by a user
create table if not exists roadmaps (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists roadmaps_owner_id_idx on roadmaps (owner_id);

-- 2. roadmap_shares: the public link for a published roadmap
create table if not exists roadmap_shares (
  id uuid primary key default gen_random_uuid(),
  roadmap_id text not null references roadmaps(id) on delete cascade,
  slug text not null unique,
  published_payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists roadmap_shares_roadmap_id_idx on roadmap_shares (roadmap_id);
create index if not exists roadmap_shares_slug_idx on roadmap_shares (slug);

-- 3. roadmap_comments: comments left on a published roadmap
create table if not exists roadmap_comments (
  id uuid primary key default gen_random_uuid(),
  roadmap_id text not null references roadmaps(id) on delete cascade,
  node_id text,
  body text not null,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists roadmap_comments_roadmap_id_idx on roadmap_comments (roadmap_id);

-- 4. roadmap_forks: tracks which roadmap was copied from which
create table if not exists roadmap_forks (
  id uuid primary key default gen_random_uuid(),
  source_roadmap_id text not null references roadmaps(id) on delete cascade,
  forked_roadmap_id text not null references roadmaps(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists roadmap_forks_roadmap_id_idx on roadmap_forks (source_roadmap_id);