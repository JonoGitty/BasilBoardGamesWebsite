interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="privacy">
      <header className="privacy__header">
        <button className="settings__back" onClick={onBack} type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <h1 className="privacy__title">Privacy Policy</h1>
      </header>

      <div className="privacy__content">
        <p className="privacy__updated">Last updated: February 18, 2026</p>

        <section className="privacy__section">
          <h2>1. Who We Are</h2>
          <p>
            Basil Board Games (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates
            an online platform that hosts lightweight social and party web games at{' '}
            <strong>basilboardgames.co.uk</strong>. We are privacy-first by design &mdash; we
            collect as little personal data as possible and do not sell personal data.
          </p>
          <p>
            Contact:{' '}
            <strong>
              [privacy@basilboardgames.co.uk]
            </strong>{' '}
            <em>(update with your actual email before launch)</em>
          </p>
        </section>

        <section className="privacy__section">
          <h2>2. Scope</h2>
          <p>
            This policy applies to basilboardgames.co.uk, any related subdomains
            (e.g. play.basilboardgames.co.uk), and any services we operate. It applies
            to users worldwide.
          </p>
        </section>

        <section className="privacy__section">
          <h2>3. Data We Collect</h2>
          <p>We intentionally minimise data collection.</p>

          <h3>3.1 Data You Provide</h3>
          <p>Only if you create an account:</p>
          <ul>
            <li>Email address</li>
            <li>Display name / nickname</li>
            <li>Password (hashed &mdash; never stored in plain text)</li>
          </ul>
          <p>We do <strong>not</strong> require real names.</p>

          <h3>3.2 Data Collected Automatically</h3>
          <p>Basic, anonymous usage data:</p>
          <ul>
            <li>Pages visited and games launched</li>
            <li>Session length and return visits</li>
            <li>Device type (mobile / desktop / tablet)</li>
            <li>Approximate country or region (derived from IP address)</li>
          </ul>

          <h3>3.3 Feedback</h3>
          <p>
            If you choose to submit anonymous feedback through our in-game feedback button:
          </p>
          <ul>
            <li>Your feedback text (up to 500 characters)</li>
            <li>Game context at the time of submission (game state, settings &mdash; no personal data)</li>
            <li>A one-way hash of your IP address, used solely for rate limiting (the raw IP is not stored)</li>
          </ul>
          <p>
            Feedback is fully anonymous &mdash; no account or login is required, and we cannot
            link feedback to any individual user.
          </p>

          <h3>3.4 What We Do NOT Collect</h3>
          <ul>
            <li>Precise location or GPS data</li>
            <li>Contacts, camera, or microphone data</li>
            <li>Keystroke logging</li>
            <li>Cross-site tracking profiles</li>
            <li>Third-party advertising data</li>
          </ul>
        </section>

        <section className="privacy__section">
          <h2>4. Analytics</h2>
          <p>
            We use <strong>first-party analytics only</strong> to understand which games are
            played, how long sessions last, and whether users return. This helps us improve
            game quality and platform stability.
          </p>
          <ul>
            <li>No third-party analytics scripts (no Google Analytics, no Meta Pixel)</li>
            <li>IP addresses are not stored with events</li>
            <li>Data is aggregated &mdash; no behavioural advertising profiles are built</li>
            <li>Analytics only run if you consent via the cookie banner</li>
            <li>You can additionally opt out at any time in Settings</li>
          </ul>
        </section>

        <section className="privacy__section">
          <h2>5. Legal Basis for Processing (UK GDPR)</h2>
          <p>We process personal data under:</p>
          <ul>
            <li>
              <strong>Consent</strong> &mdash; for optional analytics (you choose via the
              cookie banner)
            </li>
            <li>
              <strong>Contract performance</strong> &mdash; to provide your account and game
              services when you sign up
            </li>
            <li>
              <strong>Legitimate interests</strong> &mdash; to maintain platform security,
              stability, and detect abuse
            </li>
          </ul>
        </section>

        <section className="privacy__section">
          <h2>6. Cookies &amp; Local Storage</h2>
          <p>We use minimal browser storage for:</p>
          <ul>
            <li>
              <strong>basil_profile</strong> &mdash; your preferences (nickname, avatar, accent
              colour, accessibility settings)
            </li>
            <li>
              <strong>basil_consent</strong> &mdash; your cookie consent choice
            </li>
            <li>
              <strong>basil_telemetry_queue</strong> &mdash; queued analytics events (flushed
              periodically)
            </li>
            <li>
              <strong>basil_feedback_queue</strong> &mdash; queued anonymous feedback submissions
              from hub pages (flushed when online)
            </li>
            <li>
              <strong>elam_feedback_queue_local_v1</strong>,{' '}
              <strong>elam_feedback_queue_online_v1</strong> &mdash; queued feedback from Elam
              local and online modes
            </li>
            <li>
              <strong>elam_telemetry_queue_local_v1</strong>,{' '}
              <strong>elam_telemetry_queue_online_v1</strong> &mdash; queued game analytics
              events from Elam (flushed periodically, consent-gated)
            </li>
            <li>
              <strong>almost_game_state_v1</strong> &mdash; saved game state for the Almost
              card game (auto-saved, allows resuming after refresh)
            </li>
            <li>
              <strong>Supabase auth tokens</strong> &mdash; login session management
            </li>
          </ul>
          <p>
            We do <strong>not</strong> use advertising cookies, third-party tracking cookies,
            or any cross-site cookies.
          </p>
        </section>

        <section className="privacy__section">
          <h2>7. How We Use Data</h2>
          <ul>
            <li>Operate and maintain the platform</li>
            <li>Measure game engagement and improve user experience</li>
            <li>Detect abuse or cheating</li>
            <li>Maintain security and stability</li>
            <li>Communicate service updates (if you have an account)</li>
          </ul>
          <p>
            We do <strong>not</strong> sell, rent, or share personal data for advertising.
          </p>
        </section>

        <section className="privacy__section">
          <h2>8. Data Sharing</h2>
          <p>We only share data when necessary with:</p>
          <ul>
            <li>
              <strong>Supabase</strong> (database and authentication provider, EU region)
            </li>
            <li>
              <strong>GitHub Pages</strong> (static site hosting)
            </li>
            <li>
              <strong>Cloudflare</strong> (DNS and tunnel for game services)
            </li>
          </ul>
          <p>
            All processors are bound by data protection agreements. We do not sell or rent
            user data to any third party.
          </p>
        </section>

        <section className="privacy__section">
          <h2>9. International Transfers</h2>
          <p>
            Because Basil Board Games is available worldwide, data may be processed outside
            your country. Our primary data processor (Supabase) operates in the EU. Where
            data leaves the UK/EEA, we rely on adequacy decisions, standard contractual
            clauses, or reputable cloud providers with compliance frameworks.
          </p>
        </section>

        <section className="privacy__section">
          <h2>10. Data Retention</h2>
          <ul>
            <li>
              <strong>Accounts:</strong> kept until you delete your account or it has been
              inactive long-term
            </li>
            <li>
              <strong>Analytics events:</strong> aggregated and anonymised; raw events retained
              for up to 90 days
            </li>
            <li>
              <strong>Feedback:</strong> anonymous feedback submissions retained for up to
              12 months, then deleted
            </li>
            <li>
              <strong>Deletion requests:</strong> processed within 30 days
            </li>
          </ul>
        </section>

        <section className="privacy__section">
          <h2>11. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>
              <strong>Access</strong> your data &mdash; use the &ldquo;Export My Data&rdquo;
              button in Settings
            </li>
            <li>
              <strong>Correct</strong> inaccurate data &mdash; edit your profile in Settings
            </li>
            <li>
              <strong>Delete</strong> your data &mdash; use &ldquo;Delete My Account&rdquo;
              in Settings
            </li>
            <li><strong>Restrict</strong> processing</li>
            <li><strong>Object</strong> to processing</li>
            <li><strong>Data portability</strong></li>
            <li>
              <strong>Withdraw consent</strong> &mdash; toggle analytics opt-out in Settings
              at any time
            </li>
          </ul>
          <p>
            To exercise any of these rights, use the in-app controls or contact us at the
            email above.
          </p>
          <p>
            <strong>UK residents:</strong> you have the right to lodge a complaint with the
            Information Commissioner&rsquo;s Office (ICO) at{' '}
            <strong>ico.org.uk</strong>.
          </p>
        </section>

        <section className="privacy__section">
          <h2>12. Children</h2>
          <p>
            Basil Board Games is not directed at children under 13. If we learn that we have
            collected personal data from a child without appropriate consent, we will delete
            it promptly.
          </p>
        </section>

        <section className="privacy__section">
          <h2>13. Security</h2>
          <p>We use reasonable technical measures to protect your data:</p>
          <ul>
            <li>Encryption in transit (HTTPS everywhere)</li>
            <li>Passwords hashed using industry-standard algorithms</li>
            <li>Row-level security on database tables</li>
            <li>Minimal data collection by design</li>
          </ul>
          <p>
            No system is 100% secure, but we take data protection seriously and follow
            security best practices.
          </p>
        </section>

        <section className="privacy__section">
          <h2>14. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. The &ldquo;last updated&rdquo; date
            at the top will be revised. Major changes will be communicated on the site.
          </p>
        </section>

        <section className="privacy__section">
          <h2>15. Contact</h2>
          <p>
            For privacy enquiries, contact us at:{' '}
            <strong>
              [privacy@basilboardgames.co.uk]
            </strong>
          </p>
          <p>
            <em>
              Replace the placeholder email above with your actual contact address before
              publishing.
            </em>
          </p>
        </section>
      </div>
    </div>
  );
}
