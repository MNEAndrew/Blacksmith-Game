import type { LeaderboardEntry } from '../types/auth';
import { formatNumber } from '../utils/gameLogic';

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  playerRank: number;
  currentUserId: string | null;
  enabled: boolean;
  onRefresh: () => void;
}

export function LeaderboardPanel({
  entries,
  loading,
  error,
  playerRank,
  currentUserId,
  enabled,
  onRefresh,
}: LeaderboardPanelProps) {
  if (!enabled) {
    return (
      <section className="panel leaderboard-panel" aria-labelledby="leaderboard-heading">
        <h2 id="leaderboard-heading">Leaderboard</h2>
        <p className="panel-subtitle">Add Supabase env vars to enable online rankings.</p>
      </section>
    );
  }

  return (
    <section className="panel leaderboard-panel" aria-labelledby="leaderboard-heading">
      <div className="panel-header-row">
        <div>
          <h2 id="leaderboard-heading">Leaderboard</h2>
          <p className="panel-subtitle">Top smiths ranked by reputation.</p>
        </div>
        <button
          type="button"
          className="secondary-btn"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh leaderboard"
        >
          {loading ? '…' : '↻'}
        </button>
      </div>

      {playerRank > 0 && (
        <p className="leaderboard-rank">Your rank: <strong>#{playerRank}</strong></p>
      )}

      {error && <p className="auth-error" role="alert">{error}</p>}

      {entries.length === 0 && !loading && !error && (
        <p className="empty-state">No scores yet. Be the first on the board!</p>
      )}

      {entries.length > 0 && (
        <ol className="leaderboard-list">
          {entries.map((entry, index) => {
            const isYou = entry.user_id === currentUserId;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

            return (
              <li
                key={entry.user_id}
                className={`leaderboard-row ${isYou ? 'leaderboard-row--you' : ''}`}
              >
                <span className="leaderboard-row__rank">
                  {medal ?? `#${index + 1}`}
                </span>
                <span className="leaderboard-row__name">{entry.username}</span>
                <span className="leaderboard-row__score">
                  {formatNumber(entry.reputation)} ⭐
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
