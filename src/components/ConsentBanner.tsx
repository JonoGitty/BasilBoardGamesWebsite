import { useState } from 'react';
import { getConsent, setConsent } from '../lib/consent';
import type { ConsentLevel } from '../lib/consent';
import { track } from '../analytics/track';

interface ConsentBannerProps {
  onOpenPrivacy: () => void;
}

export default function ConsentBanner({ onOpenPrivacy }: ConsentBannerProps) {
  const [visible, setVisible] = useState(() => getConsent() === null);

  if (!visible) return null;

  const handleChoice = (level: ConsentLevel) => {
    setConsent(level);
    track('privacy_consent', { level });
    setVisible(false);
  };

  return (
    <div className="consent-banner" role="dialog" aria-label="Cookie consent">
      <p className="consent-banner__text">
        We use essential local storage for your preferences and optional analytics
        to improve the site. No third-party cookies are used.{' '}
        <button className="consent-banner__policy-link" onClick={onOpenPrivacy} type="button">
          Privacy Policy
        </button>
      </p>
      <div className="consent-banner__actions">
        <button
          className="consent-banner__btn consent-banner__btn--accept"
          onClick={() => handleChoice('all')}
          type="button"
        >
          Accept All
        </button>
        <button
          className="consent-banner__btn consent-banner__btn--essential"
          onClick={() => handleChoice('essential')}
          type="button"
        >
          Essential Only
        </button>
      </div>
    </div>
  );
}
