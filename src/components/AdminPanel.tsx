import { useState } from 'react';
import AdminGamesTab from './AdminGamesTab';
import AdminPostsTab from './AdminPostsTab';

type AdminTab = 'games' | 'posts';

interface AdminPanelProps {
  onBack: () => void;
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>('games');

  return (
    <div className="admin">
      <header className="admin__header">
        <button className="settings__back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Hub
        </button>
        <h1 className="admin__title">Admin</h1>
        <nav className="admin__tabs">
          <button
            className={`admin__tab${tab === 'games' ? ' admin__tab--active' : ''}`}
            onClick={() => setTab('games')}
          >
            Games
          </button>
          <button
            className={`admin__tab${tab === 'posts' ? ' admin__tab--active' : ''}`}
            onClick={() => setTab('posts')}
          >
            Posts
          </button>
        </nav>
      </header>
      <div className="admin__content">
        {tab === 'games' ? <AdminGamesTab /> : <AdminPostsTab />}
      </div>
    </div>
  );
}
