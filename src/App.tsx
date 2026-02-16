import { useState, useCallback, useEffect } from 'react';
import type { Game } from './types/game';
import { launchGame } from './services/gameLauncher';
import { AuthProvider } from './auth/AuthContext';
import { useProfile } from './hooks/useProfile';
import { track } from './analytics/track';
import LayoutShell from './components/LayoutShell';
import GameLaunch from './components/GameLaunch';

function AppContent() {
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const { profile, update, reset } = useProfile();

  useEffect(() => {
    track('app_open', {});
  }, []);

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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
