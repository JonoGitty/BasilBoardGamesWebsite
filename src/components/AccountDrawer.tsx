import { useEffect, useRef, useState } from 'react';
import type { Profile } from '../types/profile';
import { useAuth } from '../auth/AuthContext';
import SettingsPanel from './SettingsPanel';
import AuthForm from './AuthForm';

interface AccountDrawerProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
  onResetProfile: () => void;
}

type View = 'nav' | 'settings' | 'auth';

function AccountNav({
  profile,
  onNavigate,
}: {
  profile: Profile;
  onNavigate: (view: View) => void;
}) {
  const { user, signOut } = useAuth();

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
        <div>
          <span className="account-drawer__name">{profile.nickname || 'Player'}</span>
          {user && (
            <span className="account-drawer__email">{user.email}</span>
          )}
        </div>
      </div>
      <nav>
        <ul className="account-drawer__nav">
          <li>
            <button
              className="account-drawer__link"
              onClick={() => onNavigate('settings')}
            >
              <span className="account-drawer__link-icon" aria-hidden="true">
                {'\u2699\uFE0F'}
              </span>
              Settings
            </button>
          </li>
          <li>
            <button className="account-drawer__link">
              <span className="account-drawer__link-icon" aria-hidden="true">
                {'\uD83D\uDD14'}
              </span>
              Notifications
            </button>
          </li>
          {user ? (
            <li>
              <button className="account-drawer__link" onClick={signOut}>
                <span className="account-drawer__link-icon" aria-hidden="true">
                  {'\uD83D\uDEAA'}
                </span>
                Sign Out
              </button>
            </li>
          ) : (
            <li>
              <button
                className="account-drawer__link"
                onClick={() => onNavigate('auth')}
              >
                <span className="account-drawer__link-icon" aria-hidden="true">
                  {'\uD83D\uDD11'}
                </span>
                Sign In
              </button>
            </li>
          )}
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

  if (view === 'auth') {
    return <AuthForm onBack={() => setView('nav')} />;
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
