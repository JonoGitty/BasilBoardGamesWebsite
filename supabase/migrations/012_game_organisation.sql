-- ============================================================
-- 012_game_organisation.sql — Add enabled, status, sort_order
-- ============================================================

-- 1. Add updated_at if missing (003 didn't include it, but admin-command sets it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'games' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.games ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- 2. New columns
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS enabled    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS status     text    NOT NULL DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- 3. Backfill: vaulted games get status 'prototype', active get 'live'
UPDATE public.games SET status = 'prototype' WHERE vault = true;
UPDATE public.games SET status = 'live'      WHERE vault = false;

-- 4. Backfill sort_order from current active games (preserve familiar order)
UPDATE public.games SET sort_order = 1 WHERE id = 'elam';
UPDATE public.games SET sort_order = 2 WHERE id = 'interrogate';
UPDATE public.games SET sort_order = 3 WHERE id = 'almost';
UPDATE public.games SET sort_order = 4 WHERE id = 'sidequests';

-- 5. Add check constraint for status values
ALTER TABLE public.games
  ADD CONSTRAINT games_status_check
  CHECK (status IN ('prototype', 'beta', 'polished', 'live'));
