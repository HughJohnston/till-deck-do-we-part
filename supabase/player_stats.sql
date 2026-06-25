-- Run once in Supabase SQL editor (safe if v1 was already applied).
-- One row per username; lightweight counters only — no event log.

create table if not exists public.player_stats (
  name text primary key check (char_length(name) between 1 and 40),
  total_time_ms bigint not null default 0 check (total_time_ms >= 0),
  games_played integer not null default 0 check (games_played >= 0),
  updated_at timestamptz not null default now()
);

alter table public.player_stats add column if not exists best_score integer not null default 0;
alter table public.player_stats add column if not exists longest_run_ms bigint not null default 0;
alter table public.player_stats add column if not exists synergy_completions integer not null default 0;
alter table public.player_stats add column if not exists honeymoon_games integer not null default 0;
alter table public.player_stats add column if not exists wilf_games integer not null default 0;
alter table public.player_stats add column if not exists ruth_games integer not null default 0;
alter table public.player_stats add column if not exists first_played_at timestamptz;
alter table public.player_stats add column if not exists last_played_at timestamptz;
alter table public.player_stats add column if not exists active_days integer not null default 0;
alter table public.player_stats add column if not exists last_active_date date;

create index if not exists player_stats_total_time_ms_idx
  on public.player_stats (total_time_ms desc);

create index if not exists player_stats_games_played_idx
  on public.player_stats (games_played desc);

create index if not exists player_stats_best_score_idx
  on public.player_stats (best_score desc);

create index if not exists player_stats_synergy_completions_idx
  on public.player_stats (synergy_completions desc);

alter table public.player_stats enable row level security;

drop policy if exists "player_stats_anon_read" on public.player_stats;
create policy "player_stats_anon_read"
  on public.player_stats for select
  to anon, authenticated
  using (true);

-- Drop v1 signature if present, then install v2.
drop function if exists public.record_player_activity(text, bigint, integer);

create or replace function public.record_player_activity(
  p_name text,
  p_time_delta_ms bigint default 0,
  p_games_delta integer default 0,
  p_run_score integer default 0,
  p_run_ms bigint default 0,
  p_synergy_delta integer default 0,
  p_is_honeymoon boolean default false,
  p_character text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(p_name);
  v_today date := (now() at time zone 'utc')::date;
  v_prev_date date;
begin
  if v_name is null or char_length(v_name) = 0 then
    return;
  end if;
  if p_time_delta_ms < 0 or p_games_delta < 0 or p_synergy_delta < 0 then
    return;
  end if;
  if p_time_delta_ms = 0 and p_games_delta = 0 then
    return;
  end if;

  select last_active_date into v_prev_date
  from public.player_stats
  where name = v_name;

  insert into public.player_stats (
    name,
    total_time_ms,
    games_played,
    best_score,
    longest_run_ms,
    synergy_completions,
    honeymoon_games,
    wilf_games,
    ruth_games,
    first_played_at,
    last_played_at,
    active_days,
    last_active_date
  )
  values (
    v_name,
    p_time_delta_ms,
    p_games_delta,
    case when p_games_delta > 0 then greatest(0, p_run_score) else 0 end,
    case when p_games_delta > 0 then greatest(0, p_run_ms) else 0 end,
    greatest(0, p_synergy_delta),
    case when p_games_delta > 0 and p_is_honeymoon then 1 else 0 end,
    case when p_games_delta > 0 and p_character = 'wilf' then 1 else 0 end,
    case when p_games_delta > 0 and p_character = 'ruth' then 1 else 0 end,
    case when p_games_delta > 0 then now() else null end,
    case when p_games_delta > 0 then now() else null end,
    case when p_games_delta > 0 then 1 else 0 end,
    case when p_games_delta > 0 then v_today else null end
  )
  on conflict (name) do update set
    total_time_ms = player_stats.total_time_ms + excluded.total_time_ms,
    games_played = player_stats.games_played + excluded.games_played,
    best_score = case
      when excluded.games_played > 0 then greatest(player_stats.best_score, excluded.best_score)
      else player_stats.best_score
    end,
    longest_run_ms = case
      when excluded.games_played > 0 then greatest(player_stats.longest_run_ms, excluded.longest_run_ms)
      else player_stats.longest_run_ms
    end,
    synergy_completions = player_stats.synergy_completions + excluded.synergy_completions,
    honeymoon_games = player_stats.honeymoon_games + excluded.honeymoon_games,
    wilf_games = player_stats.wilf_games + excluded.wilf_games,
    ruth_games = player_stats.ruth_games + excluded.ruth_games,
    first_played_at = coalesce(player_stats.first_played_at, excluded.first_played_at),
    last_played_at = case
      when excluded.games_played > 0 then now()
      else player_stats.last_played_at
    end,
    active_days = player_stats.active_days + case
      when excluded.games_played > 0
        and (player_stats.last_active_date is null or player_stats.last_active_date < v_today)
      then 1 else 0
    end,
    last_active_date = case
      when excluded.games_played > 0 then v_today
      else player_stats.last_active_date
    end,
    updated_at = now();
end;
$$;

revoke all on function public.record_player_activity(
  text, bigint, integer, integer, bigint, integer, boolean, text
) from public;
grant execute on function public.record_player_activity(
  text, bigint, integer, integer, bigint, integer, boolean, text
) to anon, authenticated;
