import type { GameState } from '../types/game';
import { formatNumber } from '../utils/gameLogic';

interface ContractStatsPanelProps {
  state: GameState;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="contract-stat-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ContractStatsPanel({ state }: ContractStatsPanelProps) {
  const stats = state.contracts.contractStats;
  const resolved = stats.completed + stats.failed;
  const successRate = resolved > 0 ? Math.round((stats.completed / resolved) * 100) : 0;

  return (
    <section className="panel contracts-section" aria-labelledby="contract-stats-heading">
      <h2 id="contract-stats-heading">Contract Stats</h2>
      <div className="contract-stat-grid">
        <StatTile label="Completed" value={formatNumber(stats.completed)} />
        <StatTile label="Failed" value={formatNumber(stats.failed)} />
        <StatTile label="Expired" value={formatNumber(stats.expired)} />
        <StatTile label="Success Rate" value={`${successRate}%`} />
        <StatTile label="Coins Earned" value={formatNumber(stats.coinsEarned)} />
        <StatTile label="Reputation Earned" value={formatNumber(stats.reputationEarned)} />
        <StatTile label="Reputation Lost" value={formatNumber(stats.reputationLost)} />
        <StatTile label="Penalties Paid" value={formatNumber(stats.penaltiesPaid)} />
        <StatTile label="Largest Reward" value={formatNumber(stats.largestReward)} />
        <StatTile label="Worst Penalty" value={formatNumber(stats.worstPenalty)} />
        <StatTile label="Slots Unlocked" value={`${state.contracts.unlockedContractSlots} / 3`} />
        <StatTile label="Best Streak" value={formatNumber(stats.bestCompletionStreak)} />
      </div>
    </section>
  );
}
