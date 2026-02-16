import { useState, useEffect, useCallback } from 'react';
import { fetchMetricsSnapshot } from '../services/metricsApi';
import type { MetricsSnapshot } from '../types/metrics';

export function useMetrics() {
  const [snapshot, setSnapshot] = useState<MetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const data = await fetchMetricsSnapshot();
    if (data) {
      setSnapshot(data);
    } else {
      setError('Failed to load metrics');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMetricsSnapshot().then((data) => {
      if (!cancelled) {
        if (data) setSnapshot(data);
        else setError('Failed to load metrics');
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return { snapshot, loading, error, refresh };
}
