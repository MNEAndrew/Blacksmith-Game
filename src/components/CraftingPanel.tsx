import { CRAFTABLE_ITEMS } from '../data/items';
import type { GameModifiers, GameState, MaterialKey, ResourceKey } from '../types/game';
import { GEM_LABELS, MATERIAL_LABELS } from '../types/game';
import {
  canAffordCraftable,
  canUnlockMaterial,
  formatUnlockRequirement,
  getCraftableProgressInfo,
  getPickaxeCraftProgress,
  getPreviousMaterial,
  getReputationGain,
  getSellPrice,
  isItemUnlocked,
} from '../utils/gameLogic';

interface CraftingPanelProps {
  state: GameState;
  modifiers: GameModifiers;
  onCraft: (itemId: string) => void;
  onUnlockMaterial: (material: MaterialKey) => void;
}

const RESOURCE_LABELS: Record<ResourceKey, string> = {
  ...MATERIAL_LABELS,
  coins: 'coins',
  reputation: 'reputation',
};

function formatRequirements(item: (typeof CRAFTABLE_ITEMS)[number]): string {
  const resourceParts = Object.entries(item.requiredResources)
    .filter(([, amount]) => (amount ?? 0) > 0)
    .map(([key, amount]) => `${amount} ${RESOURCE_LABELS[key as ResourceKey].toLowerCase()}`);
  const gemParts = Object.entries(item.requiredGems ?? {})
    .filter(([, amount]) => (amount ?? 0) > 0)
    .map(([key, amount]) => `${amount} ${GEM_LABELS[key as keyof typeof GEM_LABELS]}`);

  return [...resourceParts, ...gemParts].join(' / ');
}

export function CraftingPanel({ state, modifiers, onCraft, onUnlockMaterial }: CraftingPanelProps) {
  return (
    <section className="panel crafting-panel" aria-labelledby="crafting-heading">
      <h2 id="crafting-heading">Crafting Bench</h2>
      <p className="panel-subtitle">Forge pickaxes to unlock tiers, then sell weapons and armor for profit.</p>
      <div className="card-grid">
        {CRAFTABLE_ITEMS.map((item) => {
          const unlocked = isItemUnlocked(item, state);
          const affordable = canAffordCraftable(state, item);
          const sellPrice = getSellPrice(item, modifiers);
          const repGain = getReputationGain(item, modifiers);
          const progress = getCraftableProgressInfo(item, state);
          const percent = Math.round(progress.ratio * 100);
          const pickaxeProgress = item.pickaxeMaterial
            ? getPickaxeCraftProgress(state, item.pickaxeMaterial)
            : null;
          const previousMaterial = item.pickaxeMaterial ? getPreviousMaterial(item.pickaxeMaterial) : null;
          const previousPickaxeCount = previousMaterial
            ? state.inventory[`${previousMaterial}-pickaxe`] ?? 0
            : 0;
          const unlockablePickaxe = !!item.pickaxeMaterial && !unlocked && previousMaterial;
          const canUnlock = item.pickaxeMaterial ? canUnlockMaterial(state, item.pickaxeMaterial) : false;

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
                <span>Cost: {formatRequirements(item)}</span>
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
              {unlockablePickaxe ? (
                <button
                  type="button"
                  className="craft-btn craft-btn--unlock"
                  disabled={!canUnlock}
                  onClick={() => item.pickaxeMaterial && onUnlockMaterial(item.pickaxeMaterial)}
                  aria-label={`Unlock ${item.name}`}
                >
                  <span>Unlock</span>
                  <small>
                    {Math.min(previousPickaxeCount, 100)} / 100 {MATERIAL_LABELS[previousMaterial]} Pickaxes
                  </small>
                </button>
              ) : !unlocked ? (
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
