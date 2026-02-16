import { useState, useCallback } from 'react';
import type { Game } from '../types/game';
import TopBar from './TopBar';
import WhatsNew from './WhatsNew';
import GameCarousel from './GameCarousel';
import AccountDrawer from './AccountDrawer';

interface LayoutShellProps {
  onLaunchGame: (game: Game) => void;
}

export default function LayoutShell({ onLaunchGame }: LayoutShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <>
      <TopBar onMenuOpen={openDrawer} />
      <main className="shell">
        <WhatsNew />
        <GameCarousel onLaunch={onLaunchGame} />
        <AccountDrawer open={drawerOpen} onClose={closeDrawer} />
      </main>
    </>
  );
}
