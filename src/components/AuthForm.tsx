import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';

type Mode = 'sign-in' | 'sign-up';

export default function AuthForm({ onBack, onSignedIn }: { onBack: () => void; onSignedIn?: () => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);

    const result = mode === 'sign-in'
      ? await signIn(email, password)
      : await signUp(email, password);

    setBusy(false);

    if (result.error) {
      setError(result.error);
    } else if (mode === 'sign-in') {
      onSignedIn?.();
    } else if ('confirmationSent' in result && result.confirmationSent) {
      setInfo('Check your email to confirm your account.');
      setMode('sign-in');
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'));
    setError(null);
  };

  return (
    <div className="auth-form">
      <button className="settings__back" onClick={onBack} type="button">
        &larr; Back
      </button>
      <h2 className="auth-form__heading">
        {mode === 'sign-in' ? 'Sign In' : 'Create Account'}
      </h2>

      <form onSubmit={handleSubmit}>
        <label className="auth-form__field">
          <span className="auth-form__label">Email</span>
          <input
            className="settings__input"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="auth-form__field">
          <span className="auth-form__label">Password</span>
          <input
            className="settings__input"
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {info && <p className="auth-form__info">{info}</p>}
        {error && <p className="auth-form__error">{error}</p>}

        <button
          className="auth-form__submit"
          type="submit"
          disabled={busy}
        >
          {busy ? 'Please wait\u2026' : mode === 'sign-in' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <button className="auth-form__toggle" onClick={toggleMode} type="button">
        {mode === 'sign-in'
          ? "Don't have an account? Sign Up"
          : 'Already have an account? Sign In'}
      </button>
    </div>
  );
}
