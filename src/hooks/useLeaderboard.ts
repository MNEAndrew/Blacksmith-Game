import { useCallback, useEffect, useState } from 'react';
import type { LeaderboardEntry } from '../types/auth';
import { fetchLeaderboard } from '../utils/leaderboard';

const REFRESH_INTERVAL_MS = 30_000;

export function useLeaderboard(enabled: boolean, currentUserId?: string | null, limit = 25) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    const { data, error: fetchError } = await fetchLeaderboard(limit);
    setEntries(data as LeaderboardEntry[]);
    setError(fetchError);
    setLoading(false);
  }, [enabled, limit]);

  useEffect(() => {
    if (!enabled) {
      setEntries([]);
      return;
    }

    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, refresh]);

  const playerRank =
    currentUserId != null
      ? entries.findIndex((entry) => entry.user_id === currentUserId) + 1
      : 0;

  return { entries, loading, error, playerRank, refresh };
}
