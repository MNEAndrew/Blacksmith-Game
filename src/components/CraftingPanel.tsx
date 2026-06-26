import { CRAFTABLE_ITEMS } from '../data/items';
import type { GameModifiers, GameState, ResourceKey } from '../types/game';
import { MATERIAL_LABELS } from '../types/game';
import {
  canAffordResources,
  formatUnlockRequirement,
  getCraftableProgressInfo,
  getPickaxeCraftProgress,
  getReputationGain,
  getSellPrice,
  isItemUnlocked,
} from '../utils/gameLogic';

interface CraftingPanelProps {
  state: GameState;
  modifiers: GameModifiers;
  onCraft: (itemId: string) => void;
}

const RESOURCE_LABELS: Record<ResourceKey, string> = {
  ...MATERIAL_LABELS,
  coins: 'coins',
  reputation: 'reputation',
};

function formatRequirements(required: Partial<Record<ResourceKey, number>>): string {
  const parts = Object.entries(required)
    .filter(([, amount]) => (amount ?? 0) > 0)
    .map(([key, amount]) => `${amount} ${RESOURCE_LABELS[key as ResourceKey].toLowerCase()}`);
  return parts.join(' / ');
}

export function CraftingPanel({ state, modifiers, onCraft }: CraftingPanelProps) {
  return (
    <section className="panel crafting-panel" aria-labelledby="crafting-heading">
      <h2 id="crafting-heading">Crafting Bench</h2>
      <p className="panel-subtitle">Hammer raw materials into sellable masterpieces.</p>
      <div className="card-grid">
        {CRAFTABLE_ITEMS.map((item) => {
          const unlocked = isItemUnlocked(item, state);
          const affordable = canAffordResources(state.resources, item.requiredResources);
          const sellPrice = getSellPrice(item, modifiers);
          const repGain = getReputationGain(item, modifiers);
          const progress = getCraftableProgressInfo(item, state);
          const percent = Math.round(progress.ratio * 100);
          const pickaxeProgress = item.pickaxeMaterial
            ? getPickaxeCraftProgress(state, item.pickaxeMaterial)
            : null;

          return (
            <article
              key={item.id}
              className={`craft-card craft-card--${item.rarity} ${unlocked ? '' : 'craft-card--locked'}`}
            >
              <div className="craft-card__header">
                <span className="craft-card__emoji" aria-hidden="true">{item.emoji}</span>
                <div>
                  <h3 className="craft-card__name">{item.name}</h3>
                  <span className={`rarity-badge rarity-badge--${item.rarity}`}>{item.rarity}</span>
                </div>
              </div>
              <p className="craft-card__desc">{item.description}</p>
              <div className="craft-card__meta">
                <span>Cost: {formatRequirements(item.requiredResources)}</span>
                <span>Sells: {sellPrice} coins / +{repGain} rep</span>
                {pickaxeProgress && (
                  <span>
                    Crafted: {pickaxeProgress.current} / {pickaxeProgress.required}
                  </span>
                )}
              </div>
              <div className="progress-block craft-card__progress" aria-label={`${item.name} progress`}>
                <div className="progress-block__row">
                  <span>{progress.label}</span>
                  <strong>{percent}%</strong>
                </div>
                <div className="progress-track">
                  <span className="progress-fill" style={{ width: `${percent}%` }} />
                </div>
              </div>
              {!unlocked ? (
                <p className="craft-card__lock">Locked: {formatUnlockRequirement(item.unlockRequirement)}</p>
              ) : (
                <button
                  type="button"
                  className="craft-btn"
                  disabled={!affordable}
                  onClick={() => onCraft(item.id)}
                  aria-label={`Craft ${item.name}`}
                >
                  {affordable ? 'Forge Item' : 'Need Resources'}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
