import type { Profile, LauncherStyle } from '../types/profile';
import { LAUNCHER_STYLES } from '../types/profile';
import { track } from '../analytics/track';

interface AdminSettingsTabProps {
  profile: Profile;
  onUpdateProfile: (patch: Partial<Profile>) => void;
}

export default function AdminSettingsTab({ profile, onUpdateProfile }: AdminSettingsTabProps) {
  return (
    <div>
      <h2 className="settings__heading">Site Appearance</h2>

      <div className="settings__field">
        <label className="settings__label" htmlFor="launcher-style">
          Game Launcher Theme
        </label>
        <select
          id="launcher-style"
          className="settings__input"
          value={profile.launcherStyle}
          onChange={(e) => {
            const value = e.target.value as LauncherStyle;
            onUpdateProfile({ launcherStyle: value });
            track('settings_change', { field: 'launcherStyle' });
          }}
        >
          {LAUNCHER_STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="settings__hint">
          Changes the game card layout on the home screen. Takes effect immediately.
        </p>
      </div>
    </div>
  );
}
