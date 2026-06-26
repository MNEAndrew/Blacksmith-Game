import { useState, type FormEvent } from 'react';
import type { AuthMode } from '../types/auth';

interface AuthPanelProps {
  open: boolean;
  onClose: () => void;
  onSignUp: (username: string, password: string) => Promise<{ error: string | null }>;
  onSignIn: (username: string, password: string) => Promise<{ error: string | null }>;
  busy: boolean;
}

export function AuthPanel({
  open,
  onClose,
  onSignUp,
  onSignIn,
  busy,
}: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const result =
      mode === 'signup'
        ? await onSignUp(username, password)
        : await onSignIn(username, password);

    if (result.error) {
      setError(result.error);
      return;
    }

    setUsername('');
    setPassword('');
    onClose();
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
      onClick={onClose}
    >
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <h2 id="auth-title">{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
        <p className="auth-modal__hint">
          Pick a smith name and password. No email required — your username is your account.
        </p>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Log In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="e.g. ironhand"
              disabled={busy}
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="At least 6 characters"
              disabled={busy}
              required
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions auth-actions">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="craft-btn auth-submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
