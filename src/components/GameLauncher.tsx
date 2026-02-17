import { useState, useCallback, useRef } from 'react';
import type { Game } from '../types/game';
import type { LauncherStyle } from '../types/profile';
import { useFeaturedGames } from '../hooks/useFeaturedGames';
import { track } from '../analytics/track';
import GameCarousel from './GameCarousel';

interface GameLauncherProps {
  theme: LauncherStyle;
  onLaunch: (game: Game) => void;
}

export default function GameLauncher({ theme, onLaunch }: GameLauncherProps) {
  if (theme === 'classic') {
    return <GameCarousel onLaunch={onLaunch} />;
  }

  return <ThemedLauncher theme={theme} onLaunch={onLaunch} />;
}

function ThemedLauncher({
  theme,
  onLaunch,
}: {
  theme: 'craft-desk' | 'netflix' | 'nebula';
  onLaunch: (game: Game) => void;
}) {
  const games = useFeaturedGames();
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleClick = useCallback(
    (game: Game) => {
      if (launchingId) return;
      track('card_click', { gameId: game.id });
      setLaunchingId(game.id);

      const reducedMotion = document.documentElement.classList.contains('reduce-motion');
      const delay = reducedMotion ? 50 : 400;

      timerRef.current = setTimeout(() => {
        setLaunchingId(null);
        onLaunch(game);
      }, delay);
    },
    [launchingId, onLaunch],
  );

  return (
    <section className="launcher" data-launcher-theme={theme} aria-label="Featured games">
      {games.map((game) => {
        const isTarget = launchingId === game.id;
        const isFading = launchingId !== null && !isTarget;

        let className = 'launcher__card';
        if (isTarget) className += ' launcher__card--target';
        if (isFading) className += ' launcher__card--fade';

        return (
          <button
            key={game.id}
            className={className}
            aria-label={`Play ${game.title}`}
            onClick={() => handleClick(game)}
            disabled={launchingId !== null && !isTarget}
          >
            <span className="launcher__icon" aria-hidden="true">
              {game.emoji}
            </span>
            <span className="launcher__label">{game.title}</span>
            {game.badge && (
              <span className="launcher__badge">{game.badge.toUpperCase()}</span>
            )}
          </button>
        );
      })}
    </section>
  );
}
