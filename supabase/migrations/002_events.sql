-- Events table: one row per client telemetry event
-- event_id is client-generated UUID for idempotent insertion
create table public.events (
  event_id    uuid primary key,
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  payload     jsonb not null default '{}',
  timestamp   bigint not null,
  received_at timestamptz not null default now()
);

-- Time-range queries (DAU, WAU, retention)
create index idx_events_timestamp on public.events (timestamp);

-- Per-user queries (retention, session analysis)
create index idx_events_user_id on public.events (user_id)
  where user_id is not null;

-- Event-type filtering (e.g. game_end for session duration)
create index idx_events_name on public.events (name);

-- Composite for user+time queries (most common analytics pattern)
create index idx_events_user_time on public.events (user_id, timestamp)
  where user_id is not null;

-- RLS: edge function uses service_role key (bypasses RLS)
-- Insert policy allows authenticated users as a fallback
alter table public.events enable row level security;

create policy "Allow event inserts"
  on public.events for insert
  with check (true);
