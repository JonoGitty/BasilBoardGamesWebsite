interface AboutPageProps {
  onBack: () => void;
}

export default function AboutPage({ onBack }: AboutPageProps) {
  return (
    <div className="privacy">
      <header className="privacy__header">
        <button className="settings__back" onClick={onBack} type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <h1 className="privacy__title">About Basil Board Games</h1>
      </header>

      <div className="privacy__content">
        <section className="privacy__section">
          <p>
            Basil Board Games is a social game laboratory.
            We build small, fast, playful web games &mdash; then we test what actually
            works with real players.
          </p>
          <p>
            Most game sites launch one big thing and hope. Basil does the opposite: we
            ship lots of tiny ideas, measure what&rsquo;s fun, improve fast, and rotate
            the best ones into the spotlight.
          </p>
        </section>

        <section className="privacy__section">
          <h2>What we believe</h2>
          <ul>
            <li><strong>Fun is a measurable thing.</strong> If people come back, it&rsquo;s working.</li>
            <li><strong>Small games can be brilliant.</strong> Not everything needs a 2-year dev cycle.</li>
            <li><strong>Community beats guessing.</strong> We build with feedback, not in a cave.</li>
            <li><strong>Privacy matters.</strong> We track as little as possible and never sell personal data.</li>
          </ul>
        </section>

        <section className="privacy__section">
          <h2>What we&rsquo;re trying to do</h2>
          <p>Build a home for lightweight party games that are:</p>
          <ul>
            <li>Instant to start</li>
            <li>Designed for groups</li>
            <li>Easy to share</li>
            <li>Great for Discord calls, friend servers, or playing locally in real life</li>
            <li>Always evolving</li>
          </ul>
        </section>

        <section className="privacy__section">
          <h2>How the platform works</h2>
          <p>
            Basil always shows a limited set of games at a time &mdash; usually 5&ndash;6.
            We&rsquo;re trialling all sorts of games: classic board games, card and party
            games, educational games, modern strategy games, and everything in between.
          </p>
          <p>Games are organised into:</p>
          <ul>
            <li><strong>Featured</strong> &mdash; polished enough for everyone</li>
            <li><strong>Beta</strong> &mdash; experimental ideas (still fun, just rougher)</li>
            <li><strong>Vault</strong> &mdash; retired for now &mdash; might return later with a glow-up</li>
          </ul>
          <p>
            When a game is well received by the community and performs strongly over
            time, we keep investing in it and move it toward a longer-term published
            release.
          </p>
        </section>

        <section className="privacy__section">
          <h2>Who we are</h2>
          <p>
            We&rsquo;re a small team obsessed with rapid experimentation and playful design.
            If you&rsquo;ve ever missed the &ldquo;jump in and play&rdquo; era of the web,
            you&rsquo;re in the right place.
          </p>
          <p>
            Got feedback or want to help test?<br />
            Email: <strong>hello@basilboardgames.co.uk</strong>
          </p>
        </section>
      </div>
    </div>
  );
}
