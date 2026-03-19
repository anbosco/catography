create table if not exists public.cat_sightings (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Chat anonyme',
  neighborhood text not null default 'Quartier inconnu',
  color text not null default 'Non precise',
  behavior text not null default 'Mystere felin',
  behaviors text[] not null default '{}',
  note text not null default 'Aucun commentaire',
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  image_path text,
  seen_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists cat_sightings_status_idx
  on public.cat_sightings (status);

create index if not exists cat_sightings_created_at_idx
  on public.cat_sightings (created_at desc);

alter table public.cat_sightings enable row level security;

create policy "Public can read approved sightings"
on public.cat_sightings
for select
using (status = 'approved');

create policy "Public can insert pending sightings"
on public.cat_sightings
for insert
with check (status = 'pending');
