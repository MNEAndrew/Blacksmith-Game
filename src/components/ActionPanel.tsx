import type { MouseEvent } from 'react';
import type { GameModifiers } from '../types/game';

interface ActionPanelProps {
  modifiers: GameModifiers;
  onMineOre: (e: MouseEvent<HTMLButtonElement>) => void;
  onChopWood: (e: MouseEvent<HTMLButtonElement>) => void;
  onPolishGems: (e: MouseEvent<HTMLButtonElement>) => void;
}

export function ActionPanel({
  modifiers,
  onMineOre,
  onChopWood,
  onPolishGems,
}: ActionPanelProps) {
  return (
    <section className="panel action-panel" aria-labelledby="actions-heading">
      <h2 id="actions-heading">Forge Actions</h2>
      <p className="panel-subtitle">Gather materials to fuel your craft.</p>
      <div className="action-grid">
        <button
          type="button"
          className="action-btn action-btn--ore"
          onClick={onMineOre}
          aria-label={`Mine ore, gain ${modifiers.orePerClick} per click`}
        >
          <span className="action-btn__icon" aria-hidden="true">⛏️</span>
          <span className="action-btn__title">Mine Ore</span>
          <span className="action-btn__detail">+{modifiers.orePerClick} per click</span>
        </button>

        <button
          type="button"
          className="action-btn action-btn--wood"
          onClick={onChopWood}
          aria-label={`Chop wood, gain ${modifiers.woodPerClick} per click`}
        >
          <span className="action-btn__icon" aria-hidden="true">🪓</span>
          <span className="action-btn__title">Chop Wood</span>
          <span className="action-btn__detail">+{modifiers.woodPerClick} per click</span>
        </button>

        <button
          type="button"
          className={`action-btn action-btn--gems ${modifiers.gemsUnlocked ? '' : 'action-btn--locked'}`}
          onClick={onPolishGems}
          disabled={!modifiers.gemsUnlocked}
          aria-label={
            modifiers.gemsUnlocked
              ? 'Polish gems, gain 1 per click'
              : 'Gem polishing locked — buy Gem Bench upgrade'
          }
        >
          <span className="action-btn__icon" aria-hidden="true">💎</span>
          <span className="action-btn__title">Polish Gems</span>
          <span className="action-btn__detail">
            {modifiers.gemsUnlocked ? '+1 per click' : 'Requires Gem Bench'}
          </span>
        </button>
      </div>
    </section>
  );
}
