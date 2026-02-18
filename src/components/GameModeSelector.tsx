import type { Game } from '../types/game';

interface GameModeSelectorProps {
  game: Game;
  onSelect: (mode: 'local' | 'online') => void;
  onClose: () => void;
}

export default function GameModeSelector({ game, onSelect, onClose }: GameModeSelectorProps) {
  return (
    <div className="mode-selector-overlay" onClick={onClose}>
      <div
        className="mode-selector"
        role="dialog"
        aria-label={`Choose how to play ${game.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mode-selector__title">Play {game.title}</h2>
        <div className="mode-selector__options">
          <button
            className="mode-selector__btn mode-selector__btn--local"
            onClick={() => onSelect('local')}
          >
            <span className="mode-selector__icon" aria-hidden="true">
              {game.emoji}
            </span>
            <span className="mode-selector__label">Play vs Bots</span>
            <span className="mode-selector__desc">Local play — works offline, no server needed</span>
          </button>
          <button
            className="mode-selector__btn mode-selector__btn--online mode-selector__btn--disabled"
            disabled
          >
            <span className="mode-selector__badge">Coming Soon</span>
            <span className="mode-selector__icon" aria-hidden="true">
              {game.emoji}
            </span>
            <span className="mode-selector__label">Play Online</span>
            <span className="mode-selector__desc">Multiplayer rooms with friends</span>
          </button>
        </div>
        <button className="mode-selector__close" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
