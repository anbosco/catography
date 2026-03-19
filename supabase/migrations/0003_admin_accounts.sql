create table if not exists public.admin_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  username text not null unique,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists admin_accounts_username_idx
  on public.admin_accounts (username);

alter table public.admin_accounts enable row level security;

drop policy if exists "Admins can read their own account" on public.admin_accounts;
create policy "Admins can read their own account"
on public.admin_accounts
for select
to authenticated
using (auth.uid() = user_id);

alter table public.cat_sightings
  add column if not exists approved_by uuid,
  add column if not exists approved_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cat_sightings_approved_by_fkey'
  ) then
    alter table public.cat_sightings
      add constraint cat_sightings_approved_by_fkey
      foreign key (approved_by)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

create index if not exists cat_sightings_approved_by_idx
  on public.cat_sightings (approved_by);
