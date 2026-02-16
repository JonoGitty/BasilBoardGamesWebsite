import type { Game } from '../types/game';
import { track } from '../analytics/track';

interface GameCardProps {
  game: Game;
  style?: React.CSSProperties;
  onLaunch?: (game: Game) => void;
}

export default function GameCard({ game, style, onLaunch }: GameCardProps) {
  return (
    <button
      className="card-fan__card"
      aria-label={`Play ${game.title}`}
      style={style}
      onClick={() => {
        track('card_click', { gameId: game.id });
        onLaunch?.(game);
      }}
    >
      <span className="card-fan__icon" aria-hidden="true">
        {game.emoji}
      </span>
      <span className="card-fan__label">{game.title}</span>
    </button>
  );
}
