import { useEffect, useRef, useState } from 'react';
import type { Profile } from '../types/profile';
import SettingsPanel from './SettingsPanel';

interface AccountDrawerProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
  onResetProfile: () => void;
}

type View = 'nav' | 'settings';

interface NavItem {
  icon: string;
  label: string;
  action?: View;
}

const NAV_ITEMS: NavItem[] = [
  { icon: '\u{2699}\uFE0F', label: 'Settings', action: 'settings' },
  { icon: '\u{1F514}', label: 'Notifications' },
  { icon: '\u{1F6AA}', label: 'Log Out' },
];

function AccountNav({
  profile,
  onNavigate,
}: {
  profile: Profile;
  onNavigate: (view: View) => void;
}) {
  return (
    <>
      <div className="account-drawer__header">
        <div
          className="account-drawer__avatar"
          style={{ borderColor: profile.accentColor }}
          aria-hidden="true"
        >
          {profile.avatarIcon}
        </div>
        <span className="account-drawer__name">{profile.nickname || 'Player'}</span>
      </div>
      <nav>
        <ul className="account-drawer__nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <button
                className="account-drawer__link"
                onClick={() => item.action && onNavigate(item.action)}
              >
                <span className="account-drawer__link-icon" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

function DrawerContent({
  profile,
  onUpdateProfile,
  onResetProfile,
}: {
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
  onResetProfile: () => void;
}) {
  const [view, setView] = useState<View>('nav');

  if (view === 'settings') {
    return (
      <SettingsPanel
        profile={profile}
        onUpdate={onUpdateProfile}
        onReset={onResetProfile}
        onBack={() => setView('nav')}
      />
    );
  }

  return <AccountNav profile={profile} onNavigate={setView} />;
}

export default function AccountDrawer({
  open,
  onClose,
  profile,
  onUpdateProfile,
  onResetProfile,
}: AccountDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const close = panelRef.current.querySelector<HTMLButtonElement>('.drawer-close');
    close?.focus();
  }, [open]);

  return (
    <>
      {/* Desktop: always-visible sidebar */}
      <aside className="account-sidebar account-drawer" aria-label="Account menu">
        <DrawerContent
          profile={profile}
          onUpdateProfile={onUpdateProfile}
          onResetProfile={onResetProfile}
        />
      </aside>

      {/* Mobile: overlay drawer */}
      <div
        className={`drawer-overlay${open ? ' drawer-overlay--open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      >
        <div
          ref={panelRef}
          className="drawer-panel"
          role="dialog"
          aria-label="Account menu"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="drawer-close" onClick={onClose} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <DrawerContent
            profile={profile}
            onUpdateProfile={onUpdateProfile}
            onResetProfile={onResetProfile}
          />
        </div>
      </div>
    </>
  );
}
