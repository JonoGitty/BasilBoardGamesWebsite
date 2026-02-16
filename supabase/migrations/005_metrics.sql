-- ============================================================
-- 005_metrics.sql — KPI snapshot RPC function (admin-only)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_metrics_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  dau_data jsonb;
  wau_data jsonb;
  retention_d1 numeric;
  retention_d7 numeric;
  session_stats jsonb;
  top_games_data jsonb;
BEGIN
  -- Admin guard
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  -- DAU (last 30 days)
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.day), '[]'::jsonb)
  INTO dau_data
  FROM (
    SELECT date_trunc('day', to_timestamp(timestamp / 1000.0))::date AS day,
           COUNT(DISTINCT user_id)::int AS users
    FROM public.events
    WHERE user_id IS NOT NULL
      AND timestamp >= extract(epoch FROM now() - interval '30 days') * 1000
    GROUP BY 1
    ORDER BY 1
  ) t;

  -- WAU (last 12 weeks)
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.week), '[]'::jsonb)
  INTO wau_data
  FROM (
    SELECT date_trunc('week', to_timestamp(timestamp / 1000.0))::date AS week,
           COUNT(DISTINCT user_id)::int AS users
    FROM public.events
    WHERE user_id IS NOT NULL
      AND timestamp >= extract(epoch FROM now() - interval '12 weeks') * 1000
    GROUP BY 1
    ORDER BY 1
  ) t;

  -- D1 retention (overall)
  WITH first_seen AS (
    SELECT user_id,
           date_trunc('day', to_timestamp(MIN(timestamp) / 1000.0)) AS cohort_day
    FROM public.events WHERE user_id IS NOT NULL GROUP BY user_id
  ),
  daily_active AS (
    SELECT DISTINCT user_id,
           date_trunc('day', to_timestamp(timestamp / 1000.0)) AS active_day
    FROM public.events WHERE user_id IS NOT NULL
  )
  SELECT COALESCE(
    ROUND(100.0 * COUNT(DISTINCT d.user_id) / NULLIF(COUNT(DISTINCT f.user_id), 0), 1),
    0
  )
  INTO retention_d1
  FROM first_seen f
  LEFT JOIN daily_active d
    ON d.user_id = f.user_id
    AND d.active_day = f.cohort_day + interval '1 day';

  -- D7 retention (overall)
  WITH first_seen AS (
    SELECT user_id,
           date_trunc('day', to_timestamp(MIN(timestamp) / 1000.0)) AS cohort_day
    FROM public.events WHERE user_id IS NOT NULL GROUP BY user_id
  ),
  daily_active AS (
    SELECT DISTINCT user_id,
           date_trunc('day', to_timestamp(timestamp / 1000.0)) AS active_day
    FROM public.events WHERE user_id IS NOT NULL
  )
  SELECT COALESCE(
    ROUND(100.0 * COUNT(DISTINCT d.user_id) / NULLIF(COUNT(DISTINCT f.user_id), 0), 1),
    0
  )
  INTO retention_d7
  FROM first_seen f
  LEFT JOIN daily_active d
    ON d.user_id = f.user_id
    AND d.active_day = f.cohort_day + interval '7 days';

  -- Session stats (game_end events, last 30 days)
  SELECT jsonb_build_object(
    'avg_ms', COALESCE(AVG((payload->>'durationMs')::bigint), 0)::bigint,
    'median_ms', COALESCE(
      PERCENTILE_CONT(0.5) WITHIN GROUP (
        ORDER BY (payload->>'durationMs')::bigint
      ), 0
    )::bigint,
    'total_sessions', COUNT(*)::int
  )
  INTO session_stats
  FROM public.events
  WHERE name = 'game_end'
    AND timestamp >= extract(epoch FROM now() - interval '30 days') * 1000;

  -- Top games (game_end events, last 30 days)
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO top_games_data
  FROM (
    SELECT payload->>'gameId' AS game_id,
           COUNT(*)::int AS sessions,
           COALESCE(AVG((payload->>'durationMs')::bigint), 0)::bigint AS avg_duration_ms
    FROM public.events
    WHERE name = 'game_end'
      AND timestamp >= extract(epoch FROM now() - interval '30 days') * 1000
    GROUP BY 1
    ORDER BY sessions DESC
    LIMIT 10
  ) t;

  result := jsonb_build_object(
    'dau', dau_data,
    'wau', wau_data,
    'retention_d1', retention_d1,
    'retention_d7', retention_d7,
    'sessions', session_stats,
    'top_games', top_games_data,
    'computed_at', now()
  );

  RETURN result;
END;
$$;
