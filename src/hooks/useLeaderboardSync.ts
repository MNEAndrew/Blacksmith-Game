import { useCallback, useEffect, useRef } from 'react';
import type { GameState } from '../types/game';
import { submitScore } from '../utils/leaderboard';

const SYNC_INTERVAL_MS = 15_000;
const DEBOUNCE_MS = 3_000;

export function useLeaderboardSync(
  gameState: GameState,
  userId: string | null,
  onSyncError?: (message: string) => void,
) {
  const lastSyncRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(gameState);

  stateRef.current = gameState;

  const syncNow = useCallback(async () => {
    if (!userId) return;

    const { error } = await submitScore(stateRef.current);
    if (error) {
      onSyncError?.(error);
    } else {
      lastSyncRef.current = Date.now();
    }
  }, [userId, onSyncError]);

  useEffect(() => {
    if (!userId) return;

    syncNow();

    const interval = setInterval(syncNow, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [userId, syncNow]);

  useEffect(() => {
    if (!userId) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (Date.now() - lastSyncRef.current >= DEBOUNCE_MS) {
        syncNow();
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    userId,
    gameState.resources.reputation,
    gameState.stats.totalCoinsEarned,
    gameState.stats.totalItemsCrafted,
    gameState.stats.totalClicks,
    syncNow,
  ]);

  return { syncNow };
}
