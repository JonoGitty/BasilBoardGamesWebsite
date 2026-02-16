import type { Profile } from '../types/profile';
import { AVATAR_ICONS, ACCENT_COLORS } from '../types/profile';

interface SettingsPanelProps {
  profile: Profile;
  onUpdate: (patch: Partial<Profile>) => void;
  onReset: () => void;
  onBack: () => void;
}

export default function SettingsPanel({ profile, onUpdate, onReset, onBack }: SettingsPanelProps) {
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
          onChange={(e) => onUpdate({ nickname: e.target.value })}
        />
      </label>

      <fieldset className="settings__field settings__fieldset">
        <legend className="settings__label">Avatar Icon</legend>
        <div className="settings__icon-grid">
          {AVATAR_ICONS.map((icon) => (
            <button
              key={icon}
              className={`settings__icon-btn${profile.avatarIcon === icon ? ' settings__icon-btn--active' : ''}`}
              onClick={() => onUpdate({ avatarIcon: icon })}
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
              onClick={() => onUpdate({ accentColor: c.value })}
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
          onChange={(e) => onUpdate({ reducedMotion: e.target.checked })}
        />
        <span className="settings__toggle-track" />
      </label>

      <label className="settings__toggle-row">
        <span>Opt out of analytics</span>
        <input
          type="checkbox"
          className="settings__checkbox"
          checked={profile.analyticsOptOut}
          onChange={(e) => onUpdate({ analyticsOptOut: e.target.checked })}
        />
        <span className="settings__toggle-track" />
      </label>

      <button className="settings__reset" onClick={onReset}>
        Reset to defaults
      </button>
    </div>
  );
}
