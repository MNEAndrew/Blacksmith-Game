import { SUPABASE_NOT_CONFIGURED_MESSAGE } from '../lib/supabase';
import type { LeaderboardEntry } from '../types/auth';
import { formatNumber } from '../utils/gameLogic';

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  playerRank: number;
  currentUserId: string | null;
  enabled: boolean;
  syncBusy: boolean;
  onRefresh: () => void;
  onSyncScore: () => void;
}

export function LeaderboardPanel({
  entries,
  loading,
  error,
  playerRank,
  currentUserId,
  enabled,
  syncBusy,
  onRefresh,
  onSyncScore,
}: LeaderboardPanelProps) {
  if (!enabled) {
    return (
      <section className="panel leaderboard-panel" aria-labelledby="leaderboard-heading">
        <h2 id="leaderboard-heading">Leaderboard</h2>
        <p className="panel-subtitle">{SUPABASE_NOT_CONFIGURED_MESSAGE}</p>
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
        <div className="leaderboard-actions">
          {currentUserId && (
            <button
              type="button"
              className="secondary-btn"
              onClick={onSyncScore}
              disabled={syncBusy}
            >
              {syncBusy ? 'Syncing...' : 'Sync Score'}
            </button>
          )}
          <button
            type="button"
            className="secondary-btn"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh leaderboard"
            title="Refresh leaderboard"
          >
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
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

            return (
              <li
                key={entry.user_id}
                className={`leaderboard-row ${isYou ? 'leaderboard-row--you' : ''}`}
              >
                <span className="leaderboard-row__rank">
                  #{index + 1}
                </span>
                <span className="leaderboard-row__name">{entry.username}</span>
                <span className="leaderboard-row__score">
                  {formatNumber(entry.reputation)} rep
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
