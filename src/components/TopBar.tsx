interface TopBarProps {
  onMenuOpen: () => void;
}

export default function TopBar({ onMenuOpen }: TopBarProps) {
  return (
    <header className="top-bar">
      <span className="top-bar__title">Basil Board Games</span>
      <button
        className="top-bar__btn"
        onClick={onMenuOpen}
        aria-label="Open account menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
        </svg>
      </button>
    </header>
  );
}
