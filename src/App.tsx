import { useCallback, useState } from 'react';
import { ActionPanel } from './components/ActionPanel';
import { AchievementsPanel } from './components/AchievementsPanel';
import { CraftingPanel } from './components/CraftingPanel';
import { FloatingText } from './components/FloatingText';
import { InventoryPanel } from './components/InventoryPanel';
import { ResourceBar } from './components/ResourceBar';
import { StatsPanel } from './components/StatsPanel';
import { Toast } from './components/Toast';
import { UpgradePanel } from './components/UpgradePanel';
import { useGame } from './hooks/useGame';
import './styles.css';

function App() {
  const {
    state,
    modifiers,
    toasts,
    floatingTexts,
    mineOre,
    chopWood,
    polishGems,
    craftItem,
    sellItem,
    sellAll,
    buyUpgrade,
    resetGame,
  } = useGame();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = useCallback(() => {
    resetGame();
    setShowResetConfirm(false);
  }, [resetGame]);

  return (
    <div className="app">
      <header className="game-header">
        <div className="game-header__brand">
          <span className="game-header__logo" aria-hidden="true">🔥</span>
          <div>
            <h1>Forge Rush</h1>
            <p className="tagline">Strike hot. Craft bold. Rule the market.</p>
          </div>
        </div>
        <button
          type="button"
          className="reset-btn"
          onClick={() => setShowResetConfirm(true)}
          aria-label="Reset save data"
        >
          Reset Save
        </button>
      </header>

      <ResourceBar resources={state.resources} />

      <main className="game-main">
        <div className="main-column">
          <ActionPanel
            modifiers={modifiers}
            onMineOre={mineOre}
            onChopWood={chopWood}
            onPolishGems={polishGems}
          />
          <CraftingPanel state={state} modifiers={modifiers} onCraft={craftItem} />
          <InventoryPanel
            state={state}
            modifiers={modifiers}
            onSell={sellItem}
            onSellAll={sellAll}
          />
        </div>

        <aside className="side-column">
          <UpgradePanel state={state} onBuy={buyUpgrade} />
          <AchievementsPanel state={state} />
          <StatsPanel state={state} modifiers={modifiers} />
        </aside>
      </main>

      <footer className="game-footer">
        <p>Forge Rush v1.0 — An original fantasy idle smithy. Progress saves automatically.</p>
      </footer>

      <Toast toasts={toasts} />
      <FloatingText items={floatingTexts} />

      {showResetConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <div className="modal">
            <h2 id="reset-title">Reset Save?</h2>
            <p>This will erase all progress, upgrades, and achievements. This cannot be undone.</p>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="danger-btn" onClick={handleReset}>
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
