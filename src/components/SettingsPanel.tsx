import { useState } from 'react';
import type { Profile } from '../types/profile';
import { AVATAR_ICONS, ACCENT_COLORS } from '../types/profile';
import { track } from '../analytics/track';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabase';

interface SettingsPanelProps {
  profile: Profile;
  onUpdate: (patch: Partial<Profile>) => void;
  onReset: () => void;
  onBack: () => void;
}

export default function SettingsPanel({ profile, onUpdate, onReset, onBack }: SettingsPanelProps) {
  const { user, signOut } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleExport = () => {
    const data = {
      profile: {
        nickname: profile.nickname,
        avatarIcon: profile.avatarIcon,
        accentColor: profile.accentColor,
        reducedMotion: profile.reducedMotion,
        analyticsOptOut: profile.analyticsOptOut,
      },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'basil-board-games-data.json';
    a.click();
    URL.revokeObjectURL(url);
    track('settings_change', { field: 'data_export' });
  };

  const handleDeleteRequest = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (!supabase) {
      setDeleteError('Service unavailable');
      return;
    }
    const { error } = await supabase.rpc('request_account_deletion');
    if (error) {
      setDeleteError(error.message);
      return;
    }
    track('settings_change', { field: 'account_deletion_requested' });
    await signOut();
  };

  const updateAndTrack = (patch: Partial<Profile>) => {
    onUpdate(patch);
    for (const field of Object.keys(patch)) {
      track('settings_change', { field });
    }
  };

  return (
    <div className="settings">
      <button className="settings__back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      <h3 className="settings__heading">Profile</h3>

      <label className="settings__field">
        <span className="settings__label">Nickname</span>
        <input
          className="settings__input"
          type="text"
          value={profile.nickname}
          maxLength={20}
          onChange={(e) => updateAndTrack({ nickname: e.target.value })}
        />
      </label>

      <fieldset className="settings__field settings__fieldset">
        <legend className="settings__label">Avatar Icon</legend>
        <div className="settings__icon-grid">
          {AVATAR_ICONS.map((icon) => (
            <button
              key={icon}
              className={`settings__icon-btn${profile.avatarIcon === icon ? ' settings__icon-btn--active' : ''}`}
              onClick={() => updateAndTrack({ avatarIcon: icon })}
              aria-label={`Select ${icon} avatar`}
              aria-pressed={profile.avatarIcon === icon}
            >
              {icon}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="settings__field settings__fieldset">
        <legend className="settings__label">Accent Color</legend>
        <div className="settings__color-grid">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              className={`settings__color-btn${profile.accentColor === c.value ? ' settings__color-btn--active' : ''}`}
              style={{ background: c.value }}
              onClick={() => updateAndTrack({ accentColor: c.value })}
              aria-label={c.label}
              aria-pressed={profile.accentColor === c.value}
            />
          ))}
        </div>
      </fieldset>

      <h3 className="settings__heading">Preferences</h3>

      <label className="settings__toggle-row">
        <span>Reduced motion</span>
        <input
          type="checkbox"
          className="settings__checkbox"
          checked={profile.reducedMotion}
          onChange={(e) => updateAndTrack({ reducedMotion: e.target.checked })}
        />
        <span className="settings__toggle-track" />
      </label>

      <label className="settings__toggle-row">
        <span>Opt out of analytics</span>
        <input
          type="checkbox"
          className="settings__checkbox"
          checked={profile.analyticsOptOut}
          onChange={(e) => updateAndTrack({ analyticsOptOut: e.target.checked })}
        />
        <span className="settings__toggle-track" />
      </label>

      <button className="settings__reset" onClick={onReset}>
        Reset to defaults
      </button>

      {user && (
        <>
          <h3 className="settings__heading">Your Data</h3>

          <button className="settings__export-btn" onClick={handleExport} type="button">
            Export My Data
          </button>
          <p className="settings__hint">
            Downloads a JSON file of your profile data.
          </p>

          <h3 className="settings__heading settings__heading--danger">Danger Zone</h3>

          {deleteError && <p className="settings__error">{deleteError}</p>}

          <button
            className="settings__delete-btn"
            onClick={handleDeleteRequest}
            type="button"
          >
            {confirmDelete ? 'Confirm: Delete My Account' : 'Delete My Account'}
          </button>
          {confirmDelete && (
            <p className="settings__hint settings__hint--danger">
              This will schedule your account for permanent deletion within 30 days.
              You will be signed out immediately.
            </p>
          )}
        </>
      )}
    </div>
  );
}
