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
  variant?: 'compact' | 'full';
  syncBusy?: boolean;
  onRefresh: () => void;
  onSyncScore?: () => void;
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getRankLabel(index: number): string {
  if (index === 0) return '1st';
  if (index === 1) return '2nd';
  if (index === 2) return '3rd';
  return `#${index + 1}`;
}

export function LeaderboardPanel({
  entries,
  loading,
  error,
  playerRank,
  currentUserId,
  enabled,
  variant = 'compact',
  syncBusy = false,
  onRefresh,
  onSyncScore,
}: LeaderboardPanelProps) {
  const isFull = variant === 'full';

  if (!enabled) {
    return (
      <section className={`panel leaderboard-panel leaderboard-panel--${variant}`} aria-labelledby="leaderboard-heading">
        <h2 id="leaderboard-heading">Leaderboard</h2>
        <p className="panel-subtitle">{SUPABASE_NOT_CONFIGURED_MESSAGE}</p>
      </section>
    );
  }

  return (
    <section className={`panel leaderboard-panel leaderboard-panel--${variant}`} aria-labelledby="leaderboard-heading">
      <div className="panel-header-row">
        <div>
          <h2 id="leaderboard-heading">{isFull ? 'Forge Rush Leaderboard' : 'Leaderboard'}</h2>
          <p className="panel-subtitle">Rankings are based on reputation.</p>
        </div>
        <div className="leaderboard-actions">
          {onSyncScore && currentUserId && (
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
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {playerRank > 0 && (
        <p className="leaderboard-rank">Your rank: <strong>#{playerRank}</strong></p>
      )}

      {loading && entries.length === 0 && (
        <p className="empty-state">Loading leaderboard...</p>
      )}

      {error && <p className="auth-error" role="alert">{error}</p>}

      {entries.length === 0 && !loading && !error && (
        <p className="empty-state">No scores yet. Be the first on the board!</p>
      )}

      {entries.length > 0 && (
        isFull ? (
          <div className="leaderboard-table-wrap">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Username</th>
                  <th scope="col">Reputation</th>
                  <th scope="col">Coins Earned</th>
                  <th scope="col">Items Crafted</th>
                  <th scope="col">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const isYou = entry.user_id === currentUserId;

                  return (
                    <tr
                      key={entry.user_id}
                      className={isYou ? 'leaderboard-row--you' : ''}
                    >
                      <td data-label="Rank">
                        <span className={`rank-badge ${index < 3 ? 'rank-badge--top' : ''}`}>
                          {getRankLabel(index)}
                        </span>
                      </td>
                      <td data-label="Username">{entry.username}</td>
                      <td data-label="Reputation">{formatNumber(entry.reputation)}</td>
                      <td data-label="Coins Earned">{formatNumber(entry.coins_earned)}</td>
                      <td data-label="Items Crafted">{formatNumber(entry.items_crafted)}</td>
                      <td data-label="Last Updated">{formatUpdatedAt(entry.updated_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <ol className="leaderboard-list">
            {entries.slice(0, 5).map((entry, index) => {
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
        )
      )}
    </section>
  );
}
