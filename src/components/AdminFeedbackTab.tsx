import { useState, useEffect, useCallback } from 'react';
import { fetchFeedback, updateFeedbackStatus } from '../services/adminApi';
import type { FeedbackRow } from '../types/admin';

type StatusFilter = 'all' | 'new' | 'reviewed' | 'resolved' | 'dismissed';

const STATUS_OPTIONS: StatusFilter[] = ['all', 'new', 'reviewed', 'resolved', 'dismissed'];

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'new': return 'admin__fb-badge admin__fb-badge--new';
    case 'reviewed': return 'admin__fb-badge admin__fb-badge--reviewed';
    case 'resolved': return 'admin__fb-badge admin__fb-badge--resolved';
    case 'dismissed': return 'admin__fb-badge admin__fb-badge--dismissed';
    default: return 'admin__fb-badge';
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function FeedbackDetail({
  item,
  onStatusChange,
}: {
  item: FeedbackRow;
  onStatusChange: (id: number, status: string, note?: string | null) => Promise<void>;
}) {
  const [note, setNote] = useState(item.admin_note ?? '');
  const [busy, setBusy] = useState(false);

  const handleStatus = async (newStatus: string) => {
    setBusy(true);
    await onStatusChange(item.id, newStatus, note || null);
    setBusy(false);
  };

  return (
    <div className="admin__fb-detail">
      <div className="admin__fb-detail-section">
        <span className="admin__fb-detail-label">Feedback</span>
        <p className="admin__fb-detail-text">{item.feedback_text}</p>
      </div>

      {item.game_id && (
        <div className="admin__fb-detail-section">
          <span className="admin__fb-detail-label">Game</span>
          <span>{item.game_id}</span>
        </div>
      )}

      <div className="admin__fb-detail-section">
        <span className="admin__fb-detail-label">Page / Source</span>
        <span>{item.page} / {item.source}</span>
      </div>

      {item.context_json && Object.keys(item.context_json).length > 0 && (
        <div className="admin__fb-detail-section">
          <span className="admin__fb-detail-label">Context</span>
          <pre className="admin__fb-context">{JSON.stringify(item.context_json, null, 2)}</pre>
        </div>
      )}

      <div className="admin__fb-detail-section">
        <span className="admin__fb-detail-label">Admin Note</span>
        <textarea
          className="settings__input admin__textarea"
          rows={2}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note..."
        />
      </div>

      <div className="admin__fb-actions">
        {(['new', 'reviewed', 'resolved', 'dismissed'] as const)
          .filter((s) => s !== item.status)
          .map((s) => (
            <button
              key={s}
              className={`admin__action-btn ${s === 'resolved' ? 'admin__action-btn--accent' : s === 'dismissed' ? 'admin__action-btn--warn' : ''}`}
              disabled={busy}
              onClick={() => void handleStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
      </div>
    </div>
  );
}

export default function AdminFeedbackTab() {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('new');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch data when filter or refreshKey changes.
  // setState only in the async .then() callback — never synchronously in the effect body.
  // Initial loading=true comes from useState default; subsequent loads set it via event handlers.
  useEffect(() => {
    let cancelled = false;
    const filters: { status?: string } = {};
    if (filter !== 'all') filters.status = filter;

    fetchFeedback(filters).then((result) => {
      if (cancelled) return;
      if (result.error) setError(result.error);
      setItems(result.data);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [filter, refreshKey]);

  const changeFilter = useCallback((next: StatusFilter) => {
    setFilter(next);
    setLoading(true);
    setError('');
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setError('');
    setRefreshKey((k) => k + 1);
  }, []);

  const handleStatusChange = async (id: number, status: string, note?: string | null) => {
    const result = await updateFeedbackStatus(id, status, note);
    if (result.ok) {
      refresh();
      setExpandedId(null);
    } else {
      setError(result.error ?? 'Update failed');
    }
  };

  return (
    <div>
      <div className="admin__fb-toolbar">
        <select
          className="settings__input admin__select"
          value={filter}
          onChange={(e) => changeFilter(e.target.value as StatusFilter)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button className="admin__action-btn" onClick={refresh} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && (
        <div className={error.includes('migration') ? 'admin__setup-notice' : 'admin__error-wrap'}>
          <p className="admin__error">{error}</p>
        </div>
      )}
      {loading && <p className="admin__loading">Loading feedback...</p>}

      {!loading && (
        <div className="admin__list">
          {items.map((item) => (
            <div key={item.id} className="admin__fb-row">
              <button
                className="admin__fb-row-header"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                type="button"
              >
                <span className={statusBadgeClass(item.status)}>{item.status}</span>
                <span className="admin__fb-preview">{item.feedback_text.slice(0, 80)}{item.feedback_text.length > 80 ? '...' : ''}</span>
                <span className="admin__fb-meta">
                  {item.game_id && <span className="admin__fb-game">{item.game_id}</span>}
                  <span className="admin__fb-date">{formatDate(item.created_at)}</span>
                </span>
                <span className="admin__fb-expand">{expandedId === item.id ? '\u25B2' : '\u25BC'}</span>
              </button>
              {expandedId === item.id && (
                <FeedbackDetail item={item} onStatusChange={handleStatusChange} />
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="admin__empty">No feedback matching this filter.</p>
          )}
        </div>
      )}
    </div>
  );
}
