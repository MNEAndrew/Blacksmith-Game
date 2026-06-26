import { Link } from 'react-router-dom';
import { LeaderboardPanel } from '../components/LeaderboardPanel';
import { useLeaderboard } from '../hooks/useLeaderboard';

interface LeaderboardPageProps {
  currentUserId: string | null;
  enabled: boolean;
}

export function LeaderboardPage({ currentUserId, enabled }: LeaderboardPageProps) {
  const {
    entries,
    loading,
    error,
    playerRank,
    refresh,
  } = useLeaderboard(enabled, currentUserId, 50);

  return (
    <main className="leaderboard-page">
      <div className="leaderboard-page__hero">
        <p className="leaderboard-page__eyebrow">Forge Rush</p>
        <h1>Forge Rush Leaderboard</h1>
        <p>Rankings are based on reputation.</p>
        <Link className="craft-btn leaderboard-page__back" to="/">
          Back to Game
        </Link>
      </div>

      <LeaderboardPanel
        entries={entries}
        loading={loading}
        error={error}
        playerRank={playerRank}
        currentUserId={currentUserId}
        enabled={enabled}
        variant="full"
        onRefresh={refresh}
      />
    </main>
  );
}
