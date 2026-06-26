-- Forge Rush Supabase schema
-- Run this in the Supabase SQL Editor for your project.
--
-- The frontend uses Supabase email/password authentication with a separate
-- username stored in public.profiles and public.leaderboard.

-- Profiles

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Leaderboard

create table if not exists public.leaderboard (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  reputation bigint not null default 0,
  coins_earned bigint not null default 0,
  items_crafted bigint not null default 0,
  total_clicks bigint not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists leaderboard_reputation_idx
  on public.leaderboard (reputation desc);

alter table public.leaderboard enable row level security;

create policy "Anyone can read leaderboard"
  on public.leaderboard for select
  using (true);

create policy "Users can insert own leaderboard row"
  on public.leaderboard for insert
  with check (auth.uid() = user_id);

create policy "Users can update own leaderboard row"
  on public.leaderboard for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Score submission RPC
-- Only the authenticated user can update their row. Reputation only increases
-- if the submitted value is higher. Other stats use greatest() to prevent rollback.

create or replace function public.submit_score(
  new_reputation bigint,
  new_coins_earned bigint,
  new_items_crafted bigint,
  new_total_clicks bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select username into v_username
  from public.profiles
  where id = auth.uid();

  if v_username is null then
    raise exception 'Profile not found';
  end if;

  insert into public.leaderboard (
    user_id,
    username,
    reputation,
    coins_earned,
    items_crafted,
    total_clicks,
    updated_at
  )
  values (
    auth.uid(),
    v_username,
    new_reputation,
    new_coins_earned,
    new_items_crafted,
    new_total_clicks,
    now()
  )
  on conflict (user_id) do update set
    reputation = case
      when excluded.reputation > leaderboard.reputation then excluded.reputation
      else leaderboard.reputation
    end,
    coins_earned = greatest(leaderboard.coins_earned, excluded.coins_earned),
    items_crafted = greatest(leaderboard.items_crafted, excluded.items_crafted),
    total_clicks = greatest(leaderboard.total_clicks, excluded.total_clicks),
    updated_at = now();

  update public.profiles
  set last_seen = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.submit_score(bigint, bigint, bigint, bigint) from public;
grant execute on function public.submit_score(bigint, bigint, bigint, bigint) to authenticated;
