import { useEffect, useRef } from 'react';

interface AccountDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: '\u{1F464}', label: 'Account' },
  { icon: '\u{2699}\uFE0F', label: 'Settings' },
  { icon: '\u{1F514}', label: 'Notifications' },
  { icon: '\u{1F6AA}', label: 'Log Out' },
];

function AccountNav() {
  return (
    <>
      <div className="account-drawer__header">
        <div className="account-drawer__avatar" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
          </svg>
        </div>
        <span className="account-drawer__name">Player</span>
      </div>
      <nav>
        <ul className="account-drawer__nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <button className="account-drawer__link">
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

export default function AccountDrawer({ open, onClose }: AccountDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Trap focus back to close button on Shift+Tab from first focusable
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const close = panelRef.current.querySelector<HTMLButtonElement>('.drawer-close');
    close?.focus();
  }, [open]);

  return (
    <>
      {/* Desktop: always-visible sidebar */}
      <aside className="account-sidebar account-drawer" aria-label="Account menu">
        <AccountNav />
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
          <AccountNav />
        </div>
      </div>
    </>
  );
}
