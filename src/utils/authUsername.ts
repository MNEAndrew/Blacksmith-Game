const USERNAME_PATTERN = /^[a-z0-9_-]+$/;
const INTERNAL_EMAIL_DOMAIN = 'forge-rush.local';
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

export function usernameToEmail(username: string): string {
  return `${username}@${INTERNAL_EMAIL_DOMAIN}`;
}

export function emailToUsername(email: string): string | null {
  const suffix = `@${INTERNAL_EMAIL_DOMAIN}`;
  if (!email.endsWith(suffix)) return null;
  return email.slice(0, -suffix.length);
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
    return 'Account not activated. Disable email confirmation in Supabase for @forge-rush.local accounts.';
  }
  if (lower.includes('signup is disabled')) {
    return 'Sign-ups are disabled on this server.';
  }
  if (lower.includes('password')) {
    return 'Password does not meet requirements.';
  }

  return message;
}
