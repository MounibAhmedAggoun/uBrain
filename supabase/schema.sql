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


-- Row Level Security (RLS)
-- Without this, the tables above are wide open to anyone holding the
-- public "anon" API key (which ships inside the app's JS bundle). RLS makes
-- Postgres itself enforce who can read/write each row, no matter what the
-- app's own code does or doesn't check on the client side.

-- 1. roadmaps: private to their owner, full stop
alter table roadmaps enable row level security;

create policy "Owners can view their own roadmaps"
  on roadmaps for select
  using (owner_id = auth.uid());

create policy "Owners can insert their own roadmaps"
  on roadmaps for insert
  with check (owner_id = auth.uid());

create policy "Owners can update their own roadmaps"
  on roadmaps for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Owners can delete their own roadmaps"
  on roadmaps for delete
  using (owner_id = auth.uid());

-- 2. roadmap_shares: readable by anyone (that's what "published" means),
-- but only the owning roadmap's owner can create or update the share entry
alter table roadmap_shares enable row level security;

create policy "Anyone can view published roadmap shares"
  on roadmap_shares for select
  using (true);

create policy "Owners can publish their own roadmaps"
  on roadmap_shares for insert
  with check (
    exists (
      select 1 from roadmaps
      where roadmaps.id = roadmap_shares.roadmap_id
        and roadmaps.owner_id = auth.uid()
    )
  );

create policy "Owners can update their own published roadmaps"
  on roadmap_shares for update
  using (
    exists (
      select 1 from roadmaps
      where roadmaps.id = roadmap_shares.roadmap_id
        and roadmaps.owner_id = auth.uid()
    )
  );

-- 3. roadmap_comments: readable by anyone, postable by any signed-in user,
-- deletable only by the comment's author or the roadmap's owner
alter table roadmap_comments enable row level security;

create policy "Anyone can view comments"
  on roadmap_comments for select
  using (true);

-- The app never sends author_id when posting a comment (see src/lib/cloud.ts
-- addRoadmapComment), so we auto-fill it from the logged-in user instead of
-- trusting the client to send the right value.
alter table roadmap_comments alter column author_id set default auth.uid();

create policy "Signed-in users can post comments"
  on roadmap_comments for insert
  with check (auth.uid() is not null and author_id = auth.uid());

create policy "Authors or roadmap owners can delete comments"
  on roadmap_comments for delete
  using (
    author_id = auth.uid()
    or exists (
      select 1 from roadmaps
      where roadmaps.id = roadmap_comments.roadmap_id
        and roadmaps.owner_id = auth.uid()
    )
  );

-- 4. roadmap_forks: only the person who now owns the forked copy can
-- record that fork; the lineage itself is fine to show publicly
alter table roadmap_forks enable row level security;

create policy "Anyone can view fork lineage"
  on roadmap_forks for select
  using (true);

create policy "Owners of the new fork can record it"
  on roadmap_forks for insert
  with check (
    exists (
      select 1 from roadmaps
      where roadmaps.id = roadmap_forks.forked_roadmap_id
        and roadmaps.owner_id = auth.uid()
    )
  );