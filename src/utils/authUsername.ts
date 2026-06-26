const USERNAME_PATTERN = /^[a-z0-9_-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 6;

export interface UsernameValidation {
  valid: boolean;
  username: string;
  error?: string;
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function emailToUsername(email: string): string | null {
  const localPart = email.split('@')[0]?.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
  return localPart || null;
}

export function validateEmail(raw: string): { valid: boolean; email: string; error?: string } {
  const email = normalizeEmail(raw);

  if (!email) {
    return { valid: false, email, error: 'Email is required.' };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { valid: false, email, error: 'Enter a valid email address.' };
  }

  return { valid: true, email };
}

export function validateUsername(raw: string): UsernameValidation {
  const username = normalizeUsername(raw);

  if (!username) {
    return { valid: false, username, error: 'Username is required.' };
  }

  if (username.length < MIN_USERNAME_LENGTH) {
    return {
      valid: false,
      username,
      error: `Username must be at least ${MIN_USERNAME_LENGTH} characters.`,
    };
  }

  if (username.length > MAX_USERNAME_LENGTH) {
    return {
      valid: false,
      username,
      error: `Username must be at most ${MAX_USERNAME_LENGTH} characters.`,
    };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      valid: false,
      username,
      error: 'Use only letters, numbers, underscores, and hyphens.',
    };
  }

  return { valid: true, username };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required.' };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  return { valid: true };
}

export function mapAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'Wrong username or password.';
  }
  if (lower.includes('user already registered')) {
    return 'That username is already taken.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email is not confirmed yet. Check your inbox, then try logging in again.';
  }
  if (lower.includes('signup is disabled')) {
    return 'Sign-ups are disabled on this server.';
  }
  if (lower.includes('password')) {
    return 'Password does not meet requirements.';
  }

  return message;
}
