import { useState, useCallback } from 'react';
import type { Game } from '../types/game';
import type { Profile } from '../types/profile';
import TopBar from './TopBar';
import WhatsNew from './WhatsNew';
import GameLauncher from './GameLauncher';
import AccountDrawer from './AccountDrawer';
import Footer from './Footer';

interface LayoutShellProps {
  onLaunchGame: (game: Game) => void;
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
  onResetProfile: () => void;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  onOpenPrivacy: () => void;
  onOpenAbout: () => void;
}

export default function LayoutShell({
  onLaunchGame,
  profile,
  onUpdateProfile,
  onResetProfile,
  isAdmin,
  onOpenAdmin,
  onOpenPrivacy,
  onOpenAbout,
}: LayoutShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <>
      <TopBar onMenuOpen={openDrawer} />
      <main className="shell">
        <WhatsNew />
        <GameLauncher theme={profile.launcherStyle} onLaunch={onLaunchGame} />
        <AccountDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          profile={profile}
          onUpdateProfile={onUpdateProfile}
          onResetProfile={onResetProfile}
          isAdmin={isAdmin}
          onOpenAdmin={onOpenAdmin}
          onOpenPrivacy={onOpenPrivacy}
          onOpenAbout={onOpenAbout}
        />
      </main>
      <Footer onOpenPrivacy={onOpenPrivacy} onOpenAbout={onOpenAbout} />
    </>
  );
}
