import { ITEMS_BY_ID } from '../data/items';
import type { GameModifiers, GameState } from '../types/game';
import { getSellPrice } from '../utils/gameLogic';

interface InventoryPanelProps {
  state: GameState;
  modifiers: GameModifiers;
  onSell: (itemId: string) => void;
  onSellAll: () => void;
}

export function InventoryPanel({ state, modifiers, onSell, onSellAll }: InventoryPanelProps) {
  const entries = Object.entries(state.inventory).filter(([, count]) => count > 0);

  return (
    <section className="panel inventory-panel" aria-labelledby="inventory-heading">
      <div className="panel-header-row">
        <div>
          <h2 id="inventory-heading">Inventory</h2>
          <p className="panel-subtitle">Sell crafted goods at the market stall.</p>
        </div>
        {entries.length > 0 && (
          <button type="button" className="secondary-btn" onClick={onSellAll}>
            Sell All
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="empty-state">Your rack is empty. Craft something first!</p>
      ) : (
        <div className="inventory-list">
          {entries.map(([itemId, count]) => {
            const item = ITEMS_BY_ID[itemId];
            if (!item) return null;
            const price = getSellPrice(item, modifiers);

            return (
              <div key={itemId} className="inventory-row">
                <div className="inventory-row__info">
                  <span className="inventory-row__emoji" aria-hidden="true">{item.emoji}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <span className="inventory-row__count">×{count}</span>
                  </div>
                </div>
                <div className="inventory-row__actions">
                  <span className="inventory-row__price">{price} 🪙 each</span>
                  <button
                    type="button"
                    className="sell-btn"
                    onClick={() => onSell(itemId)}
                    aria-label={`Sell one ${item.name}`}
                  >
                    Sell 1
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
