export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  created_at: string;
  last_seen: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  reputation: number;
  coins_earned: number;
  items_crafted: number;
  total_clicks: number;
  updated_at: string;
}

export type AuthMode = 'login' | 'signup';
