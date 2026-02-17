import { useState } from 'react';
import { useAdminGames } from '../hooks/useAdminGames';
import { track } from '../analytics/track';
import type { AdminGameRow } from '../types/admin';
import type { GameStatus } from '../types/game';

const STATUS_OPTIONS: { value: GameStatus; label: string }[] = [
  { value: 'prototype', label: 'Prototype' },
  { value: 'beta', label: 'Beta' },
  { value: 'polished', label: 'Polished' },
  { value: 'live', label: 'Live' },
];

function GameRow({
  game,
  saveStatus,
  onToggleEnabled,
  onToggleVault,
  onTogglePin,
  onStatusChange,
  onOrderChange,
}: {
  game: AdminGameRow;
  saveStatus?: 'saving' | 'saved' | 'error';
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onToggleVault: (id: string, vault: boolean) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onStatusChange: (id: string, status: GameStatus) => void;
  onOrderChange: (id: string, order: number) => void;
}) {
  return (
    <div className="admin__game-row">
      <span className="admin__game-emoji" aria-hidden="true">{game.emoji}</span>
      <div className="admin__game-info">
        <span className="admin__game-title">
          {game.title}
          {!game.enabled && <span className="admin__game-tag admin__game-tag--disabled"> (Hidden)</span>}
          {game.vault && game.enabled && <span className="admin__game-tag admin__game-tag--vault"> (Vaulted)</span>}
        </span>
        <span className="admin__game-id">{game.id}</span>
      </div>
      <div className="admin__game-controls">
        <label className="admin__toggle">
          <span className="admin__toggle-label">Shown</span>
          <input
            type="checkbox"
            className="settings__checkbox"
            checked={game.enabled}
            onChange={() => onToggleEnabled(game.id, !game.enabled)}
          />
          <span className="settings__toggle-track" />
        </label>
        <label className="admin__toggle admin__toggle--deferred">
          <span className="admin__toggle-label">Active <span className="admin__toggle-hint">(lineup)</span></span>
          <input
            type="checkbox"
            className="settings__checkbox"
            checked={!game.vault}
            onChange={() => onToggleVault(game.id, !game.vault)}
          />
          <span className="settings__toggle-track" />
        </label>
        <label className="admin__toggle">
          <span className="admin__toggle-label">Pinned</span>
          <input
            type="checkbox"
            className="settings__checkbox"
            checked={game.pinned}
            onChange={() => onTogglePin(game.id, !game.pinned)}
          />
          <span className="settings__toggle-track" />
        </label>
        <label className="admin__inline-field">
          <span className="admin__toggle-label">Status</span>
          <select
            className="settings__input admin__select"
            value={game.status}
            onChange={(e) => onStatusChange(game.id, e.target.value as GameStatus)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className="admin__inline-field">
          <span className="admin__toggle-label">Order</span>
          <input
            type="number"
            className="settings__input admin__order-input"
            value={game.sort_order}
            min={0}
            onChange={(e) => onOrderChange(game.id, parseInt(e.target.value, 10) || 0)}
          />
        </label>
        {saveStatus && (
          <span className={`admin__save-indicator admin__save-indicator--${saveStatus}`}>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Failed'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminGamesTab() {
  const { games, loading, saving, error, lineupDirty, toggleLocal, update, applyLineup } = useAdminGames();
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});

  const clearStatus = (id: string, delay: number) => {
    setTimeout(() => setSaveStatus((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    }), delay);
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    setSaveStatus((prev) => ({ ...prev, [id]: 'saving' }));
    const result = await update(id, { enabled });
    if (result.ok) {
      track('admin_game_update', { gameId: id, fields: ['enabled'] });
      setSaveStatus((prev) => ({ ...prev, [id]: 'saved' }));
      clearStatus(id, 1500);
    } else {
      setSaveStatus((prev) => ({ ...prev, [id]: 'error' }));
      clearStatus(id, 3000);
    }
  };

  const handleToggleVault = (id: string, vault: boolean) => {
    toggleLocal(id, 'vault', vault);
  };

  const handleTogglePin = async (id: string, pinned: boolean) => {
    setSaveStatus((prev) => ({ ...prev, [id]: 'saving' }));
    const result = await update(id, { pinned });
    if (result.ok) {
      track('admin_game_update', { gameId: id, fields: ['pinned'] });
      setSaveStatus((prev) => ({ ...prev, [id]: 'saved' }));
      clearStatus(id, 1500);
    } else {
      setSaveStatus((prev) => ({ ...prev, [id]: 'error' }));
      clearStatus(id, 3000);
    }
  };

  const handleStatusChange = async (id: string, status: GameStatus) => {
    setSaveStatus((prev) => ({ ...prev, [id]: 'saving' }));
    const result = await update(id, { status });
    if (result.ok) {
      track('admin_game_update', { gameId: id, fields: ['status'] });
      setSaveStatus((prev) => ({ ...prev, [id]: 'saved' }));
      clearStatus(id, 1500);
    } else {
      setSaveStatus((prev) => ({ ...prev, [id]: 'error' }));
      clearStatus(id, 3000);
    }
  };

  const handleOrderChange = async (id: string, order: number) => {
    setSaveStatus((prev) => ({ ...prev, [id]: 'saving' }));
    const result = await update(id, { sort_order: order });
    if (result.ok) {
      track('admin_game_update', { gameId: id, fields: ['sort_order'] });
      setSaveStatus((prev) => ({ ...prev, [id]: 'saved' }));
      clearStatus(id, 1500);
    } else {
      setSaveStatus((prev) => ({ ...prev, [id]: 'error' }));
      clearStatus(id, 3000);
    }
  };

  const handleApplyLineup = async () => {
    const result = await applyLineup();
    if (result.ok) {
      const activeIds = games.filter((g) => !g.vault).map((g) => g.id);
      track('admin_game_update', { gameId: activeIds.join(','), fields: ['lineup'] });
    }
  };

  if (loading) {
    return <p className="admin__loading">Loading games...</p>;
  }

  return (
    <div>
      {error && <p className="admin__error">{error}</p>}
      <div className="admin__list">
        {games.map((game) => (
          <GameRow
            key={game.id}
            game={game}
            saveStatus={saveStatus[game.id]}
            onToggleEnabled={handleToggleEnabled}
            onToggleVault={handleToggleVault}
            onTogglePin={handleTogglePin}
            onStatusChange={handleStatusChange}
            onOrderChange={handleOrderChange}
          />
        ))}
      </div>
      {lineupDirty && (
        <div className="admin__lineup-bar">
          <button
            className="admin__action-btn admin__action-btn--primary"
            onClick={handleApplyLineup}
            disabled={saving}
            type="button"
          >
            {saving ? 'Applying...' : 'Apply Active Lineup'}
          </button>
          <span className="admin__lineup-hint">
            You have unsaved Active lineup changes
          </span>
        </div>
      )}
    </div>
  );
}
