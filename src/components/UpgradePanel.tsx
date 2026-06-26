import { UPGRADES } from '../data/upgrades';
import type { GameState } from '../types/game';
import { canPurchaseUpgrade, getUpgradeCost, getUpgradeLevel } from '../utils/gameLogic';

interface UpgradePanelProps {
  state: GameState;
  onBuy: (upgradeId: string) => void;
}

function getEffectDescription(upgradeId: string, level: number): string {
  const upgrade = UPGRADES.find((u) => u.id === upgradeId);
  if (!upgrade) return '';

  switch (upgrade.effectType) {
    case 'orePerClick':
      return `+${level} ore per click`;
    case 'woodPerClick':
      return `+${level} wood per click`;
    case 'sellMultiplier':
      return `+${Math.round(level * upgrade.effectPerLevel * 100)}% sell value`;
    case 'orePerSecond':
      return `${(level * upgrade.effectPerLevel).toFixed(1)} ore/s`;
    case 'woodPerSecond':
      return `${(level * upgrade.effectPerLevel).toFixed(1)} wood/s`;
    case 'autoSell':
      return `${level} auto-sale/s (scaled)`;
    case 'unlockGems':
      return level > 0 ? 'Gem polishing unlocked' : 'Unlocks gem polishing';
    case 'automationSpeed':
      return `+${Math.round(level * upgrade.effectPerLevel * 100)}% automation speed`;
    case 'reputationMultiplier':
      return `+${Math.round(level * upgrade.effectPerLevel * 100)}% reputation`;
    default:
      return '';
  }
}

export function UpgradePanel({ state, onBuy }: UpgradePanelProps) {
  return (
    <section className="panel upgrade-panel" aria-labelledby="upgrade-heading">
      <h2 id="upgrade-heading">Upgrade Shop</h2>
      <p className="panel-subtitle">Invest coins to expand your forge empire.</p>
      <div className="card-grid">
        {UPGRADES.map((upgrade) => {
          const level = getUpgradeLevel(state, upgrade.id);
          const maxed = level >= upgrade.maxLevel;
          const cost = getUpgradeCost(upgrade.id, level);
          const canBuy = canPurchaseUpgrade(state, upgrade.id);

          return (
            <article key={upgrade.id} className={`upgrade-card ${maxed ? 'upgrade-card--maxed' : ''}`}>
              <div className="upgrade-card__header">
                <h3>{upgrade.name}</h3>
                <span className="upgrade-level">
                  Lv {level}{upgrade.maxLevel < 99 ? ` / ${upgrade.maxLevel}` : ''}
                </span>
              </div>
              <p className="upgrade-card__desc">{upgrade.description}</p>
              {level > 0 && (
                <p className="upgrade-card__effect">{getEffectDescription(upgrade.id, level)}</p>
              )}
              <button
                type="button"
                className="upgrade-btn"
                disabled={maxed || !canBuy}
                onClick={() => onBuy(upgrade.id)}
                aria-label={`Buy ${upgrade.name} for ${cost} coins`}
              >
                {maxed ? '✓ Max Level' : `Buy — ${cost} 🪙`}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
