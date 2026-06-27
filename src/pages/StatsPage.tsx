import { Link } from 'react-router-dom';
import { ResourceBar } from '../components/ResourceBar';
import { StatsPanel } from '../components/StatsPanel';
import { useLeaderboard } from '../hooks/useLeaderboard';
import type { GameModifiers, GameState } from '../types/game';

interface StatsPageProps {
  state: GameState;
  modifiers: GameModifiers;
  currentUserId: string | null;
  loggedIn: boolean;
  leaderboardEnabled: boolean;
}

export function StatsPage({
  state,
  modifiers,
  currentUserId,
  loggedIn,
  leaderboardEnabled,
}: StatsPageProps) {
  const { playerRank, loading, error } = useLeaderboard(leaderboardEnabled, currentUserId, 50);

  return (
    <main className="stats-page">
      <ResourceBar state={state} />
      <section className="stats-page__hero">
        <h2>Forge Rush Stats</h2>
        <p>Track your forge output, inventory, upgrades, and production pace.</p>
        <Link className="secondary-btn stats-page__back" to="/">
          Back to Game
        </Link>
      </section>
      <StatsPanel
        state={state}
        modifiers={modifiers}
        loggedIn={loggedIn}
        leaderboardEnabled={leaderboardEnabled}
        leaderboardRank={playerRank > 0 ? playerRank : null}
        leaderboardLoading={loading}
        leaderboardError={error}
      />
    </main>
  );
}
