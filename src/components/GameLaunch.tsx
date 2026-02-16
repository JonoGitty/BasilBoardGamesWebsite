import { useState } from 'react';
import type { Game } from '../types/game';
import { useSession } from '../hooks/useSession';

interface GameLaunchProps {
  game: Game;
  onExit: () => void;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

export default function GameLaunch({ game, onExit }: GameLaunchProps) {
  const { endCurrentSession } = useSession(game.id);
  const [summary, setSummary] = useState<{ durationMs: number } | null>(null);

  const handleEnd = () => {
    const result = endCurrentSession();
    if (result) {
      setSummary(result);
    } else {
      onExit();
    }
  };

  if (summary) {
    return (
      <div className="game-launch">
        <div className="game-launch__summary">
          <span className="game-launch__icon" aria-hidden="true">{game.emoji}</span>
          <h2 className="game-launch__title">{game.title}</h2>
          <p className="game-launch__duration">
            Session: {formatDuration(summary.durationMs)}
          </p>
          <button className="game-launch__btn" onClick={onExit}>
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-launch">
      <div className="game-launch__frame">
        <span className="game-launch__icon game-launch__icon--lg" aria-hidden="true">
          {game.emoji}
        </span>
        <h1 className="game-launch__title">{game.title}</h1>
        <p className="game-launch__desc">{game.description}</p>
        <p className="game-launch__placeholder">Game content will appear here.</p>
        <button className="game-launch__btn" onClick={handleEnd}>
          End Session
        </button>
      </div>
    </div>
  );
}
