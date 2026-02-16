-- ============================================================
-- 003_rotation.sql — Game catalog + rotation audit log
-- ============================================================

-- 1. Master game catalog
create table public.games (
  id              text        primary key,
  title           text        not null,
  description     text        not null,
  emoji           text        not null,
  url             text,
  pinned          boolean     not null default false,
  vault           boolean     not null default true,
  cooldown_until  timestamptz,
  created_at      timestamptz not null default now()
);

-- 2. Rotation audit log
create table public.rotation_log (
  id           bigint       generated always as identity primary key,
  rotated_at   timestamptz  not null default now(),
  triggered_by text         not null,
  snapshot     jsonb        not null,
  seed         text
);

-- 3. RLS: games readable by anyone, no client writes
alter table public.games enable row level security;

create policy "Public read games"
  on public.games for select
  using (true);

-- rotation_log: service_role only (no anon access)
alter table public.rotation_log enable row level security;

-- 4. Seed the 10 existing games (6 active, 4 in vault)
insert into public.games (id, title, description, emoji, vault) values
  ('almost',      'Almost',      'Get as close as you can without going over. A game of near misses and bold guesses.', '🎯', false),
  ('sidequests',  'Sidequests',  'Embark on unexpected detours. Complete side objectives before your rivals do.',        '🗺️', false),
  ('elam',        'Elam',        'Build and trade in the cradle of civilisation. A strategic resource game.',             '🏛️', false),
  ('interrogate', 'Interrogate', 'Ask the right questions. Uncover the truth before time runs out.',                     '🔍', false),
  ('hex-havoc',   'Hex Havoc',   'Claim hexes, block opponents, and dominate the board in this territorial tug-of-war.', '⬡',  false),
  ('tall-tales',  'Tall Tales',  'Spin the most convincing story. Bluff your way to victory.',                           '📖', false);

insert into public.games (id, title, description, emoji) values
  ('deep-six',    'Deep Six',     'Dive into the depths. A press-your-luck ocean exploration game.',              '🌊'),
  ('nightmarket', 'Night Market', 'Barter, haggle, and hustle your way through a neon-lit bazaar.',               '🏮'),
  ('runestone',   'Runestone',    'Decipher ancient runes to cast powerful spells before your opponents.',         '💎'),
  ('two-timer',   'Two Timer',    'Play both sides in this double-agent deduction game.',                         '⏳');

-- 5. Initial rotation log
insert into public.rotation_log (triggered_by, snapshot, seed) values
  ('manual', '["almost","sidequests","elam","interrogate","hex-havoc","tall-tales"]', 'seed-initial');
