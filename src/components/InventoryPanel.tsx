import { ITEMS_BY_ID } from '../data/items';
import type { GameModifiers, GameState } from '../types/game';
import { getSellPrice } from '../utils/gameLogic';

interface InventoryPanelProps {
  state: GameState;
  modifiers: GameModifiers;
  onSell: (itemId: string, quantity: number) => void;
}

const SELL_AMOUNTS = [1, 10, 100] as const;

export function InventoryPanel({ state, modifiers, onSell }: InventoryPanelProps) {
  const entries = Object.entries(state.inventory).filter(([, count]) => count > 0);

  return (
    <section className="panel inventory-panel" aria-labelledby="inventory-heading">
      <div className="panel-header-row">
        <div>
          <h2 id="inventory-heading">Inventory</h2>
          <p className="panel-subtitle">Sell crafted pickaxes, weapons, and shields at the market stall.</p>
        </div>
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
                    <span className="inventory-row__count">x{count}</span>
                  </div>
                </div>
                <div className="inventory-row__actions">
                  <span className="inventory-row__price">{price} coins each</span>
                  <div className="inventory-row__buttons">
                    {SELL_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        className="sell-btn"
                        onClick={() => onSell(itemId, amount)}
                        disabled={count < amount}
                        aria-label={`Sell ${amount} ${item.name}`}
                      >
                        Sell {amount}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="sell-btn"
                      onClick={() => onSell(itemId, count)}
                      aria-label={`Sell all ${item.name}`}
                    >
                      Sell All
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
