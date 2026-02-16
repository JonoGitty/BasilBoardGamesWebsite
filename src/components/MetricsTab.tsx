import { useEffect } from 'react';
import { useMetrics } from '../hooks/useMetrics';
import { track } from '../analytics/track';
import { formatDuration, formatCompactDate } from '../utils/format';
import type { MetricsSnapshot } from '../types/metrics';

function KpiCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="metrics__card">
      <div className="metrics__card-value">{value}</div>
      <div className="metrics__card-label">{label}</div>
    </div>
  );
}

function SummaryCards({ s }: { s: MetricsSnapshot }) {
  const dauToday = s.dau.length > 0 ? s.dau[s.dau.length - 1].users : 0;
  const wauLatest = s.wau.length > 0 ? s.wau[s.wau.length - 1].users : 0;

  return (
    <div className="metrics__cards">
      <KpiCard value={String(dauToday)} label="DAU (today)" />
      <KpiCard value={String(wauLatest)} label="WAU (this week)" />
      <KpiCard value={`${s.retention_d1}%`} label="D1 Retention" />
      <KpiCard value={`${s.retention_d7}%`} label="D7 Retention" />
      <KpiCard value={formatDuration(s.sessions.avg_ms)} label="Avg Session" />
      <KpiCard value={String(s.sessions.total_sessions)} label="Sessions (30d)" />
    </div>
  );
}

function DauChart({ s }: { s: MetricsSnapshot }) {
  const recent = s.dau.slice(-14);
  const max = Math.max(...recent.map((d) => d.users), 1);

  return (
    <div className="metrics__section">
      <h3 className="metrics__section-title">Daily Active Users (14d)</h3>
      <div className="metrics__bar-chart">
        {recent.map((entry) => (
          <div key={entry.day} className="metrics__bar-row">
            <span className="metrics__bar-label">{formatCompactDate(entry.day)}</span>
            <div className="metrics__bar-track">
              <div
                className="metrics__bar-fill"
                style={{ width: `${(entry.users / max) * 100}%` }}
              />
            </div>
            <span className="metrics__bar-count">{entry.users}</span>
          </div>
        ))}
        {recent.length === 0 && (
          <p className="admin__empty">No DAU data yet.</p>
        )}
      </div>
    </div>
  );
}

function TopGamesTable({ s }: { s: MetricsSnapshot }) {
  return (
    <div className="metrics__section">
      <h3 className="metrics__section-title">Top Games (30d)</h3>
      {s.top_games.length === 0 ? (
        <p className="admin__empty">No game sessions yet.</p>
      ) : (
        <table className="metrics__table">
          <thead>
            <tr>
              <th>Game</th>
              <th>Sessions</th>
              <th>Avg Duration</th>
            </tr>
          </thead>
          <tbody>
            {s.top_games.map((g) => (
              <tr key={g.game_id}>
                <td>{g.game_id}</td>
                <td>{g.sessions}</td>
                <td>{formatDuration(g.avg_duration_ms)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function MetricsTab() {
  const { snapshot, loading, error, refresh } = useMetrics();

  useEffect(() => {
    track('admin_metrics_view', {});
  }, []);

  if (loading) {
    return <p className="admin__loading">Loading metrics...</p>;
  }

  if (error || !snapshot) {
    return (
      <div>
        <p className="admin__error">{error ?? 'Failed to load metrics'}</p>
        <button className="metrics__refresh-btn" onClick={() => void refresh()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="metrics__header">
        <span className="metrics__timestamp">
          Computed {formatCompactDate(snapshot.computed_at)}
        </span>
        <button
          className="metrics__refresh-btn"
          onClick={() => void refresh()}
        >
          Refresh
        </button>
      </div>

      <SummaryCards s={snapshot} />
      <DauChart s={snapshot} />
      <TopGamesTable s={snapshot} />
    </div>
  );
}
