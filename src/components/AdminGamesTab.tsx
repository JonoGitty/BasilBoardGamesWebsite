import { useAdminGames } from '../hooks/useAdminGames';
import { track } from '../analytics/track';
import type { AdminGameRow } from '../types/admin';

function GameRow({
  game,
  onToggleVault,
  onTogglePin,
}: {
  game: AdminGameRow;
  onToggleVault: (id: string, vault: boolean) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
}) {
  return (
    <div className="admin__game-row">
      <span className="admin__game-emoji" aria-hidden="true">{game.emoji}</span>
      <div className="admin__game-info">
        <span className="admin__game-title">{game.title}</span>
        <span className="admin__game-id">{game.id}</span>
      </div>
      <div className="admin__game-controls">
        <label className="admin__toggle">
          <span className="admin__toggle-label">Active</span>
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
      </div>
    </div>
  );
}

export default function AdminGamesTab() {
  const { games, loading, error, update } = useAdminGames();

  const handleToggleVault = async (id: string, vault: boolean) => {
    const result = await update(id, { vault });
    if (result.ok) {
      track('admin_game_update', { gameId: id, fields: ['vault'] });
    }
  };

  const handleTogglePin = async (id: string, pinned: boolean) => {
    const result = await update(id, { pinned });
    if (result.ok) {
      track('admin_game_update', { gameId: id, fields: ['pinned'] });
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
            onToggleVault={handleToggleVault}
            onTogglePin={handleTogglePin}
          />
        ))}
      </div>
    </div>
  );
}
