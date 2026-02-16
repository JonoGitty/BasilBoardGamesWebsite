-- ============================================================
-- Basil Board Games — Analytics KPI Queries
-- Run against public.events in the Supabase SQL Editor
-- ============================================================

-- ---- DAU (Daily Active Users) — last 30 days ----
select
  date_trunc('day', to_timestamp(timestamp / 1000.0)) as day,
  count(distinct user_id) as dau
from public.events
where user_id is not null
  and timestamp >= extract(epoch from now() - interval '30 days') * 1000
group by 1
order by 1;


-- ---- WAU (Weekly Active Users) — last 12 weeks ----
select
  date_trunc('week', to_timestamp(timestamp / 1000.0)) as week,
  count(distinct user_id) as wau
from public.events
where user_id is not null
  and timestamp >= extract(epoch from now() - interval '12 weeks') * 1000
group by 1
order by 1;


-- ---- D1 Retention ----
-- Of users whose first event was on day D, what % also had an event on D+1?
with first_seen as (
  select
    user_id,
    date_trunc('day', to_timestamp(min(timestamp) / 1000.0)) as cohort_day
  from public.events
  where user_id is not null
  group by user_id
),
daily_active as (
  select distinct
    user_id,
    date_trunc('day', to_timestamp(timestamp / 1000.0)) as active_day
  from public.events
  where user_id is not null
)
select
  f.cohort_day,
  count(distinct f.user_id) as cohort_size,
  count(distinct d.user_id) as returned_d1,
  round(
    count(distinct d.user_id)::numeric / nullif(count(distinct f.user_id), 0),
    3
  ) as d1_retention
from first_seen f
left join daily_active d
  on d.user_id = f.user_id
  and d.active_day = f.cohort_day + interval '1 day'
group by f.cohort_day
order by f.cohort_day;


-- ---- D7 Retention ----
with first_seen as (
  select
    user_id,
    date_trunc('day', to_timestamp(min(timestamp) / 1000.0)) as cohort_day
  from public.events
  where user_id is not null
  group by user_id
),
daily_active as (
  select distinct
    user_id,
    date_trunc('day', to_timestamp(timestamp / 1000.0)) as active_day
  from public.events
  where user_id is not null
)
select
  f.cohort_day,
  count(distinct f.user_id) as cohort_size,
  count(distinct d.user_id) as returned_d7,
  round(
    count(distinct d.user_id)::numeric / nullif(count(distinct f.user_id), 0),
    3
  ) as d7_retention
from first_seen f
left join daily_active d
  on d.user_id = f.user_id
  and d.active_day = f.cohort_day + interval '7 days'
group by f.cohort_day
order by f.cohort_day;


-- ---- Average Session Duration (from game_end events) — last 30 days ----
select
  date_trunc('day', to_timestamp(timestamp / 1000.0)) as day,
  count(*) as sessions,
  round(avg((payload->>'durationMs')::numeric) / 1000, 1) as avg_duration_sec,
  round(percentile_cont(0.5) within group (
    order by (payload->>'durationMs')::numeric
  ) / 1000, 1) as median_duration_sec
from public.events
where name = 'game_end'
  and timestamp >= extract(epoch from now() - interval '30 days') * 1000
group by 1
order by 1;


-- ---- Top Games by Session Count — last 30 days ----
select
  payload->>'gameId' as game_id,
  count(*) as session_count,
  round(avg((payload->>'durationMs')::numeric) / 1000, 1) as avg_duration_sec
from public.events
where name = 'game_end'
  and timestamp >= extract(epoch from now() - interval '30 days') * 1000
group by 1
order by session_count desc;
