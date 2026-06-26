import type { GameModifiers, GameState } from '../types/game';
import { formatNumber, getInventoryCount, getTotalProductionPerSecond } from '../utils/gameLogic';

interface StatsPanelProps {
  state: GameState;
  modifiers: GameModifiers;
}

export function StatsPanel({ state, modifiers }: StatsPanelProps) {
  const production = getTotalProductionPerSecond(modifiers);

  return (
    <section className="panel stats-panel" aria-labelledby="stats-heading">
      <h2 id="stats-heading">Forge Statistics</h2>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Total Clicks</span>
          <span className="stat-value">{formatNumber(state.stats.totalClicks)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Items Crafted</span>
          <span className="stat-value">{formatNumber(state.stats.totalItemsCrafted)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Coins Earned</span>
          <span className="stat-value">{formatNumber(state.stats.totalCoinsEarned)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Upgrades Bought</span>
          <span className="stat-value">{formatNumber(state.stats.totalUpgradesPurchased)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">In Stock</span>
          <span className="stat-value">{formatNumber(getInventoryCount(state))}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Production / sec</span>
          <span className="stat-value">{production.toFixed(1)}</span>
        </div>
      </div>
    </section>
  );
}
