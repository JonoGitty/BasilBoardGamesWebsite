import { useState, useCallback } from 'react';
import type { Game } from './types/game';
import { launchGame } from './services/gameLauncher';
import { useProfile } from './hooks/useProfile';
import LayoutShell from './components/LayoutShell';
import GameLaunch from './components/GameLaunch';

export default function App() {
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const { profile, update, reset } = useProfile();

  const handleLaunch = useCallback((game: Game) => {
    const result = launchGame(game);
    if (result.mode === 'internal') {
      setActiveGame(game);
    }
  }, []);

  const handleExit = useCallback(() => {
    setActiveGame(null);
  }, []);

  if (activeGame) {
    return <GameLaunch game={activeGame} onExit={handleExit} />;
  }

  return (
    <LayoutShell
      onLaunchGame={handleLaunch}
      profile={profile}
      onUpdateProfile={update}
      onResetProfile={reset}
    />
  );
}
