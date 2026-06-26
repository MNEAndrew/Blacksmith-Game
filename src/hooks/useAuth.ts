import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Profile } from '../types/auth';
import type { GameState } from '../types/game';
import {
  emailToUsername,
  mapAuthError,
  usernameToEmail,
  validatePassword,
  validateUsername,
} from '../utils/authUsername';
import { ensurePlayerRows } from '../utils/leaderboard';

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Profile;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authBusy, setAuthBusy] = useState(false);

  const loadProfile = useCallback(async (authUser: User) => {
    let loaded = await fetchProfile(authUser.id);

    if (!loaded) {
      const username =
        (authUser.user_metadata?.username as string | undefined) ??
        emailToUsername(authUser.email ?? '') ??
        'smith';

      await ensurePlayerRows(authUser.id, username);
      loaded = await fetchProfile(authUser.id);
    }

    setProfile(loaded);
    return loaded;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        loadProfile(nextSession.user);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(
    async (rawUsername: string, password: string, gameState?: GameState) => {
      if (!isSupabaseConfigured) {
        return { error: 'Online accounts are not configured.' };
      }

      const usernameResult = validateUsername(rawUsername);
      if (!usernameResult.valid) {
        return { error: usernameResult.error ?? 'Invalid username.' };
      }

      const passwordResult = validatePassword(password);
      if (!passwordResult.valid) {
        return { error: passwordResult.error ?? 'Invalid password.' };
      }

      setAuthBusy(true);
      try {
        const email = usernameToEmail(usernameResult.username);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: usernameResult.username },
          },
        });

        if (error) {
          return { error: mapAuthError(error.message) };
        }

        if (!data.user) {
          return { error: 'Sign-up failed. Please try again.' };
        }

        if (!data.session) {
          return {
            error:
              'Account created but not signed in. Disable email confirmation in Supabase (Authentication → Email) for @forge-rush.local sign-ups.',
          };
        }

        const rowError = await ensurePlayerRows(
          data.user.id,
          usernameResult.username,
          gameState,
        );

        if (rowError.error) {
          return { error: rowError.error };
        }

        await loadProfile(data.user);
        return { error: null };
      } finally {
        setAuthBusy(false);
      }
    },
    [loadProfile],
  );

  const signIn = useCallback(
    async (rawUsername: string, password: string) => {
      if (!isSupabaseConfigured) {
        return { error: 'Online accounts are not configured.' };
      }

      const usernameResult = validateUsername(rawUsername);
      if (!usernameResult.valid) {
        return { error: usernameResult.error ?? 'Invalid username.' };
      }

      const passwordResult = validatePassword(password);
      if (!passwordResult.valid) {
        return { error: passwordResult.error ?? 'Invalid password.' };
      }

      setAuthBusy(true);
      try {
        const email = usernameToEmail(usernameResult.username);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          return { error: mapAuthError(error.message) };
        }

        if (data.user) {
          await loadProfile(data.user);
        }

        return { error: null };
      } finally {
        setAuthBusy(false);
      }
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    setAuthBusy(true);
    try {
      await supabase.auth.signOut();
      setProfile(null);
      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-out failed.';
      return { error: message };
    } finally {
      setAuthBusy(false);
    }
  }, []);

  return {
    session,
    user,
    profile,
    loading,
    authBusy,
    isConfigured: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
  };
}
