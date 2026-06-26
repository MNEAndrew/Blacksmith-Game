import type { GameState } from '../types/game';
import { GEM_LABELS, GEM_ORDER } from '../types/game';
import { formatNumber, getTreasureHunterStats } from '../utils/gameLogic';

interface TreasureHunterPanelProps {
  state: GameState;
  onSend: () => void;
}

export function TreasureHunterPanel({ state, onSend }: TreasureHunterPanelProps) {
  const stats = getTreasureHunterStats(state);
  const unlocked = state.treasureHunter.unlocked && stats.level > 0;

  return (
    <section className="panel treasure-panel" aria-labelledby="treasure-heading">
      <div className="panel-header-row">
        <div>
          <h2 id="treasure-heading">Treasure Hunter</h2>
          <p className="panel-subtitle">
            Send him out for non-guaranteed gems. Each search costs 10 Gold.
          </p>
        </div>
        {unlocked && <span className="upgrade-level">Lv {stats.level} / 10</span>}
      </div>

      {!unlocked ? (
        <p className="empty-state">Unlock the Treasure Hunter in the Upgrade Shop after reaching the gold tier.</p>
      ) : (
        <>
          <div className="treasure-summary">
            <div className="stat-item">
              <span className="stat-label">Slots</span>
              <span className="stat-value">{stats.availableAttempts} / {stats.maxSlots}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Run Cost</span>
              <span className="stat-value">{formatNumber(stats.expeditionCost)} Gold</span>
            </div>
          </div>

          <div className="gem-grid" aria-label="Gem inventory and odds">
            {GEM_ORDER.map((gem) => (
              <div key={gem} className="gem-chip">
                <strong>{GEM_LABELS[gem]}</strong>
                <span>{formatNumber(state.gemInventory[gem])} owned</span>
                <span>{stats.odds[gem]}% chance</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="craft-btn"
            onClick={onSend}
            disabled={stats.availableAttempts <= 0}
          >
            Send Treasure Hunter
          </button>
        </>
      )}
    </section>
  );
}
