import { useState, useCallback, useEffect } from 'react';
import type { Game } from './types/game';
import { launchGame, launchGameMode } from './services/gameLauncher';
import { AuthProvider } from './auth/AuthContext';
import { useProfile } from './hooks/useProfile';
import { useAdmin } from './hooks/useAdmin';
import { track, initTransport } from './analytics/track';
import LayoutShell from './components/LayoutShell';
import GameLaunch from './components/GameLaunch';
import GameModeSelector from './components/GameModeSelector';
import AdminPanel from './components/AdminPanel';
import PrivacyPolicy from './components/PrivacyPolicy';
import AboutPage from './components/AboutPage';
import ConsentBanner from './components/ConsentBanner';

type AppView = 'home' | 'game' | 'admin' | 'privacy' | 'about';

function AppContent() {
  const [view, setView] = useState<AppView>('home');
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [choosingGame, setChoosingGame] = useState<Game | null>(null);
  const { profile, update, reset } = useProfile();
  const { isAdmin } = useAdmin(profile);

  useEffect(() => {
    track('app_open', {});
    initTransport();
  }, []);

  const handleLaunch = useCallback((game: Game) => {
    const result = launchGame(game);
    if (result.mode === 'choose') {
      setChoosingGame(result.game);
    } else if (result.mode === 'internal') {
      setActiveGame(game);
      setView('game');
    }
  }, []);

  const handleModeSelect = useCallback((mode: 'local' | 'online') => {
    if (choosingGame) {
      launchGameMode(choosingGame, mode);
      setChoosingGame(null);
    }
  }, [choosingGame]);

  const handleModeClose = useCallback(() => {
    setChoosingGame(null);
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

  const handleOpenPrivacy = useCallback(() => {
    setView('privacy');
  }, []);

  const handleClosePrivacy = useCallback(() => {
    setView('home');
  }, []);

  const handleOpenAbout = useCallback(() => {
    setView('about');
  }, []);

  const handleCloseAbout = useCallback(() => {
    setView('home');
  }, []);

  if (view === 'about') {
    return <AboutPage onBack={handleCloseAbout} />;
  }

  if (view === 'privacy') {
    return <PrivacyPolicy onBack={handleClosePrivacy} />;
  }

  if (view === 'game' && activeGame) {
    return <GameLaunch game={activeGame} onExit={handleExit} />;
  }

  if (view === 'admin' && isAdmin) {
    return <AdminPanel onBack={handleCloseAdmin} profile={profile} onUpdateProfile={update} />;
  }

  return (
    <>
      <LayoutShell
        onLaunchGame={handleLaunch}
        profile={profile}
        onUpdateProfile={update}
        onResetProfile={reset}
        isAdmin={isAdmin}
        onOpenAdmin={handleOpenAdmin}
        onOpenPrivacy={handleOpenPrivacy}
        onOpenAbout={handleOpenAbout}
      />
      {choosingGame && (
        <GameModeSelector
          game={choosingGame}
          onSelect={handleModeSelect}
          onClose={handleModeClose}
        />
      )}
      <ConsentBanner onOpenPrivacy={handleOpenPrivacy} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
