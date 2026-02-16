import { useState, useCallback, useEffect } from 'react';
import type { Game } from './types/game';
import { launchGame } from './services/gameLauncher';
import { AuthProvider } from './auth/AuthContext';
import { useProfile } from './hooks/useProfile';
import { useAdmin } from './hooks/useAdmin';
import { track, initTransport } from './analytics/track';
import LayoutShell from './components/LayoutShell';
import GameLaunch from './components/GameLaunch';
import AdminPanel from './components/AdminPanel';

type AppView = 'home' | 'game' | 'admin';

function AppContent() {
  const [view, setView] = useState<AppView>('home');
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const { profile, update, reset } = useProfile();
  const { isAdmin } = useAdmin(profile);

  useEffect(() => {
    track('app_open', {});
    initTransport();
  }, []);

  const handleLaunch = useCallback((game: Game) => {
    const result = launchGame(game);
    if (result.mode === 'internal') {
      setActiveGame(game);
      setView('game');
    }
  }, []);

  const handleExit = useCallback(() => {
    setActiveGame(null);
    setView('home');
  }, []);

  const handleOpenAdmin = useCallback(() => {
    track('admin_open', {});
    setView('admin');
  }, []);

  const handleCloseAdmin = useCallback(() => {
    setView('home');
  }, []);

  if (view === 'game' && activeGame) {
    return <GameLaunch game={activeGame} onExit={handleExit} />;
  }

  if (view === 'admin' && isAdmin) {
    return <AdminPanel onBack={handleCloseAdmin} />;
  }

  return (
    <LayoutShell
      onLaunchGame={handleLaunch}
      profile={profile}
      onUpdateProfile={update}
      onResetProfile={reset}
      isAdmin={isAdmin}
      onOpenAdmin={handleOpenAdmin}
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
