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

export default function GameCarousel() {
  const games = useFeaturedGames();

  return (
    <section className="card-fan" aria-label="Featured games">
      {games.map((game, i) => (
        <GameCard
          key={game.id}
          game={game}
          style={fanStyle(i, games.length)}
        />
      ))}
    </section>
  );
}
