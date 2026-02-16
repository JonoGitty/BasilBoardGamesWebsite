import { useState, useCallback } from 'react';
import TopBar from './TopBar';
import WhatsNew from './WhatsNew';
import GameCarousel from './GameCarousel';
import AccountDrawer from './AccountDrawer';

export default function LayoutShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <>
      <TopBar onMenuOpen={openDrawer} />
      <main className="shell">
        <WhatsNew />
        <GameCarousel />
        <AccountDrawer open={drawerOpen} onClose={closeDrawer} />
      </main>
    </>
  );
}
