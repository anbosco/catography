alter table public.cat_sightings
  add column if not exists behaviors text[] not null default '{}';

create table if not exists public.cat_reactions (
  sighting_id uuid not null references public.cat_sightings(id) on delete cascade,
  visitor_token text not null,
  created_at timestamptz not null default now(),
  primary key (sighting_id, visitor_token)
);

create index if not exists cat_reactions_sighting_idx
  on public.cat_reactions (sighting_id);

alter table public.cat_reactions enable row level security;
