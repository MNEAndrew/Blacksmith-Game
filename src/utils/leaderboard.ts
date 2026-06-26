import { supabase } from '../lib/supabase';
import type { GameState } from '../types/game';

export async function submitScore(state: GameState): Promise<{ error: string | null }> {
  const reputation = Math.floor(state.resources.reputation);
  const coinsEarned = Math.floor(state.stats.totalCoinsEarned);
  const itemsCrafted = Math.floor(state.stats.totalItemsCrafted);
  const totalClicks = Math.floor(state.stats.totalClicks);

  const { error } = await supabase.rpc('submit_score', {
    new_reputation: reputation,
    new_coins_earned: coinsEarned,
    new_items_crafted: itemsCrafted,
    new_total_clicks: totalClicks,
  });

  return { error: error?.message ?? null };
}

export async function fetchLeaderboard(limit = 25): Promise<{
  data: Array<{
    user_id: string;
    username: string;
    reputation: number;
    coins_earned: number;
    items_crafted: number;
    total_clicks: number;
    updated_at: string;
  }>;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('user_id, username, reputation, coins_earned, items_crafted, total_clicks, updated_at')
    .order('reputation', { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

export async function ensurePlayerRows(
  userId: string,
  username: string,
  state?: GameState,
): Promise<{ error: string | null }> {
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      username,
      display_name: username,
      last_seen: new Date().toISOString(),
    },
    { onConflict: 'id', ignoreDuplicates: true },
  );

  if (profileError) {
    return { error: profileError.message };
  }

  const reputation = Math.floor(state?.resources.reputation ?? 0);
  const coinsEarned = Math.floor(state?.stats.totalCoinsEarned ?? 0);
  const itemsCrafted = Math.floor(state?.stats.totalItemsCrafted ?? 0);
  const totalClicks = Math.floor(state?.stats.totalClicks ?? 0);

  const { error: leaderboardError } = await supabase.from('leaderboard').upsert(
    {
      user_id: userId,
      username,
      reputation,
      coins_earned: coinsEarned,
      items_crafted: itemsCrafted,
      total_clicks: totalClicks,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id', ignoreDuplicates: true },
  );

  return { error: leaderboardError?.message ?? null };
}
