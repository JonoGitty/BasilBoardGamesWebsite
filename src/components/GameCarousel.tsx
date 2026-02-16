import type { Game } from '../types/game';
import { useFeaturedGames } from '../hooks/useFeaturedGames';
import GameCard from './GameCard';

/** Spread angle (degrees) per card from center. */
const ANGLE_STEP = 6;

function fanStyle(index: number, total: number): React.CSSProperties {
  const mid = (total - 1) / 2;
  const offset = index - mid;
  const rotate = offset * ANGLE_STEP;

  return {
    '--fan-rotate': `${rotate}deg`,
  } as React.CSSProperties;
}

interface GameCarouselProps {
  onLaunch: (game: Game) => void;
}

export default function GameCarousel({ onLaunch }: GameCarouselProps) {
  const games = useFeaturedGames();

  return (
    <section className="card-fan" aria-label="Featured games">
      {games.map((game, i) => (
        <GameCard
          key={game.id}
          game={game}
          style={fanStyle(i, games.length)}
          onLaunch={onLaunch}
        />
      ))}
    </section>
  );
}
