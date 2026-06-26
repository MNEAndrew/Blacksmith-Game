import { CRAFTABLE_ITEMS } from '../data/items';
import type { GameModifiers, GameState } from '../types/game';
import {
  canAffordResources,
  formatUnlockRequirement,
  getReputationGain,
  getSellPrice,
  isItemUnlocked,
} from '../utils/gameLogic';

interface CraftingPanelProps {
  state: GameState;
  modifiers: GameModifiers;
  onCraft: (itemId: string) => void;
}

function formatRequirements(required: Partial<Record<string, number>>): string {
  const parts: string[] = [];
  if (required.ore) parts.push(`${required.ore} ore`);
  if (required.wood) parts.push(`${required.wood} wood`);
  if (required.gems) parts.push(`${required.gems} gems`);
  return parts.join(' · ');
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
                <span>Sells: {sellPrice} 🪙 · +{repGain} ⭐</span>
              </div>
              {!unlocked ? (
                <p className="craft-card__lock">🔒 {formatUnlockRequirement(item.unlockRequirement)}</p>
              ) : (
                <button
                  type="button"
                  className="craft-btn"
                  disabled={!affordable}
                  onClick={() => onCraft(item.id)}
                  aria-label={`Craft ${item.name}`}
                >
                  {affordable ? '🔥 Forge Item' : 'Need Resources'}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
