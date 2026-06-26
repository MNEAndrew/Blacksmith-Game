import type { MouseEvent } from 'react';
import type { GameModifiers, GameState, MaterialKey } from '../types/game';
import { MATERIAL_LABELS, MATERIAL_ORDER, SPECIALIST_MATERIALS } from '../types/game';
import { canManuallyAcquireMaterial } from '../utils/gameLogic';

interface ActionPanelProps {
  state: GameState;
  modifiers: GameModifiers;
  onGatherMaterial: (material: MaterialKey, e: MouseEvent<HTMLButtonElement>) => void;
}

export function ActionPanel({
  state,
  modifiers,
  onGatherMaterial,
}: ActionPanelProps) {
  const manualMaterials = MATERIAL_ORDER.filter((material) =>
    canManuallyAcquireMaterial(state, material),
  );

  return (
    <section className="panel action-panel" aria-labelledby="actions-heading">
      <h2 id="actions-heading">Forge Actions</h2>
      <p className="panel-subtitle">
        Gather materials manually. Gold and higher tiers require miner specialist automation.
      </p>
      <div className="action-grid">
        {manualMaterials.map((material) => (
          <button
            key={material}
            type="button"
            className={`action-btn action-btn--${material}`}
            onClick={(event) => onGatherMaterial(material, event)}
            aria-label={`Gather ${MATERIAL_LABELS[material]}, gain ${modifiers.gatherPerClick[material]} per click`}
          >
            <span className="action-btn__icon" aria-hidden="true">{material === 'wood' ? '🪵' : '⛏'}</span>
            <span className="action-btn__title">
              {material === 'wood' ? 'Chop' : 'Mine'} {MATERIAL_LABELS[material]}
            </span>
            <span className="action-btn__detail">+{modifiers.gatherPerClick[material]} per click</span>
          </button>
        ))}

        {SPECIALIST_MATERIALS.map((material) => (
          <button
            key={material}
            type="button"
            className="action-btn action-btn--locked"
            disabled
            aria-label={`${MATERIAL_LABELS[material]} requires a miner specialist`}
          >
            <span className="action-btn__icon" aria-hidden="true">⚙</span>
            <span className="action-btn__title">{MATERIAL_LABELS[material]}</span>
            <span className="action-btn__detail">Specialist only</span>
          </button>
        ))}
      </div>
    </section>
  );
}
