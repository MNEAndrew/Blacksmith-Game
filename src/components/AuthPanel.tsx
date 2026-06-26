import { useState, type FormEvent } from 'react';
import { SUPABASE_NOT_CONFIGURED_MESSAGE } from '../lib/supabase';
import type { AuthMode } from '../types/auth';
import type { AuthActionResult } from '../hooks/useAuth';

interface AuthPanelProps {
  open: boolean;
  configured: boolean;
  onClose: () => void;
  onSignUp: (email: string, username: string, password: string) => Promise<AuthActionResult>;
  onSignIn: (email: string, password: string) => Promise<AuthActionResult>;
  busy: boolean;
}

export function AuthPanel({
  open,
  configured,
  onClose,
  onSignUp,
  onSignIn,
  busy,
}: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const result =
      mode === 'signup'
        ? await onSignUp(email, username, password)
        : await onSignIn(email, password);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.message) {
      setInfo(result.message);
      setMode('login');
      setPassword('');
      return;
    }

    setEmail('');
    setUsername('');
    setPassword('');
    onClose();
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setInfo(null);
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

        {!configured ? (
          <>
            <p className="auth-info" role="status">
              {SUPABASE_NOT_CONFIGURED_MESSAGE}
            </p>
            <div className="modal-actions auth-actions">
              <button type="button" className="secondary-btn" onClick={onClose}>
                Continue as Guest
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="auth-modal__hint">
              Use email and password for your account. Your username appears on the leaderboard.
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
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={busy}
                  required
                />
              </label>

              {mode === 'signup' && (
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
              )}

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

              {info && (
                <p className="auth-info" role="status">
                  {info}
                </p>
              )}

              <div className="modal-actions auth-actions">
                <button type="button" className="secondary-btn" onClick={onClose} disabled={busy}>
                  Cancel
                </button>
                <button type="submit" className="craft-btn auth-submit" disabled={busy}>
                  {busy ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
