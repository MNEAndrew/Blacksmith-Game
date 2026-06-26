import type { GameState, ResourceKey } from '../types/game';
import { MATERIAL_LABELS, MATERIAL_ORDER } from '../types/game';
import { formatNumber, getResourceProgressTargets } from '../utils/gameLogic';

interface ResourceBarProps {
  state: GameState;
}

const RESOURCE_CONFIG: Array<{ key: ResourceKey; label: string }> = [
  ...MATERIAL_ORDER.map((key) => ({ key, label: MATERIAL_LABELS[key] })),
  { key: 'coins', label: 'Coins' },
  { key: 'reputation', label: 'Reputation' },
];

export function ResourceBar({ state }: ResourceBarProps) {
  const progressTargets = getResourceProgressTargets(state);

  return (
    <div className="resource-bar" role="region" aria-label="Resources">
      {RESOURCE_CONFIG.map(({ key, label }) => {
        const target = progressTargets[key];
        const ratio = target?.ratio ?? 0;

        return (
          <div key={key} className="resource-chip" title={label}>
            <div className="resource-chip__main">
              <span className="resource-label">{label}</span>
              <span className="resource-value">{formatNumber(state.resources[key])}</span>
            </div>
            {target && (
              <div className="progress-block progress-block--resource" aria-label={`${label} progress`}>
                <div className="progress-track">
                  <span className="progress-fill" style={{ width: `${ratio * 100}%` }} />
                </div>
                <span className="progress-label">
                  {formatNumber(target.current)} / {formatNumber(target.required)} - {target.label}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
