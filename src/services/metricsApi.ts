import { supabase } from '../lib/supabase';
import type { MetricsSnapshot } from '../types/metrics';

/** Fetch the KPI metrics snapshot via Postgres RPC. Admin-only. */
export async function fetchMetricsSnapshot(): Promise<MetricsSnapshot | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('get_metrics_snapshot');

  if (error || !data) return null;
  return data as MetricsSnapshot;
}
