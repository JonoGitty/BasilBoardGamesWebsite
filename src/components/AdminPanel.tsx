import { useState } from 'react';
import type { Profile } from '../types/profile';
import AdminGamesTab from './AdminGamesTab';
import AdminPostsTab from './AdminPostsTab';
import MetricsTab from './MetricsTab';
import AdminSettingsTab from './AdminSettingsTab';

type AdminTab = 'games' | 'posts' | 'metrics' | 'settings';

interface AdminPanelProps {
  onBack: () => void;
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
}

export default function AdminPanel({ onBack, profile, onUpdateProfile }: AdminPanelProps) {
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
          <button
            className={`admin__tab${tab === 'metrics' ? ' admin__tab--active' : ''}`}
            onClick={() => setTab('metrics')}
          >
            Metrics
          </button>
          <button
            className={`admin__tab${tab === 'settings' ? ' admin__tab--active' : ''}`}
            onClick={() => setTab('settings')}
          >
            Settings
          </button>
        </nav>
      </header>
      <div className="admin__content">
        {tab === 'games' && <AdminGamesTab />}
        {tab === 'posts' && <AdminPostsTab />}
        {tab === 'metrics' && <MetricsTab />}
        {tab === 'settings' && <AdminSettingsTab profile={profile} onUpdateProfile={onUpdateProfile} />}
      </div>
    </div>
  );
}
