import { UPGRADES } from '../data/upgrades';
import type { GameState } from '../types/game';
import { MATERIAL_LABELS } from '../types/game';
import {
  canPurchaseUpgrade,
  formatUnlockRequirement,
  getUpgradeCost,
  getUpgradeLevel,
  meetsUnlockRequirement,
} from '../utils/gameLogic';

interface UpgradePanelProps {
  state: GameState;
  onBuy: (upgradeId: string) => void;
}

function getEffectDescription(upgradeId: string, level: number): string {
  const upgrade = UPGRADES.find((u) => u.id === upgradeId);
  if (!upgrade) return '';

  switch (upgrade.effectType) {
    case 'materialPerClick':
      return `+${level} material per manual click`;
    case 'sellMultiplier':
      return `+${Math.round(level * upgrade.effectPerLevel * 100)}% sell value`;
    case 'materialPerSecond':
      return upgrade.materialKey
        ? `${(level * upgrade.effectPerLevel).toFixed(1)} ${MATERIAL_LABELS[upgrade.materialKey].toLowerCase()}/s`
        : `${(level * upgrade.effectPerLevel).toFixed(1)} material/s`;
    case 'autoSell':
      return `${level} auto-sale/s (scaled)`;
    case 'automationSpeed':
      return `+${Math.round(level * upgrade.effectPerLevel * 100)}% automation speed`;
    case 'reputationMultiplier':
      return `+${Math.round(level * upgrade.effectPerLevel * 100)}% reputation`;
    case 'minerSpecialist':
      return upgrade.materialKey
        ? `${MATERIAL_LABELS[upgrade.materialKey]} specialist hired`
        : 'Specialist hired';
    case 'treasureHunter':
      return level > 0 ? `${Math.min(100, level * 10)} gem search slots` : 'Unlocks gem expeditions';
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
          const unlocked = !upgrade.unlockRequirement || meetsUnlockRequirement(upgrade.unlockRequirement, state);
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
              {!unlocked && upgrade.unlockRequirement && (
                <p className="upgrade-card__effect">
                  Requires {formatUnlockRequirement(upgrade.unlockRequirement)}
                </p>
              )}
              <button
                type="button"
                className="upgrade-btn"
                disabled={maxed || !canBuy}
                onClick={() => onBuy(upgrade.id)}
                aria-label={`Buy ${upgrade.name} for ${cost} coins`}
              >
                {maxed ? 'Max Level' : `Buy - ${cost} coins`}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
