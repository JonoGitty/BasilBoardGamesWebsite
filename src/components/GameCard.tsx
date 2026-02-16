import type { Game } from '../types/game';

interface GameCardProps {
  game: Game;
  style?: React.CSSProperties;
}

export default function GameCard({ game, style }: GameCardProps) {
  return (
    <button
      className="card-fan__card"
      aria-label={game.title}
      style={style}
    >
      <span className="card-fan__icon" aria-hidden="true">
        {game.emoji}
      </span>
      <span className="card-fan__label">{game.title}</span>
    </button>
  );
}
