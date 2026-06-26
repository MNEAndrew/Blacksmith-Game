import type { Resources } from '../types/game';
import { formatNumber } from '../utils/gameLogic';

interface ResourceBarProps {
  resources: Resources;
}

const RESOURCE_CONFIG = [
  { key: 'ore' as const, label: 'Ore', emoji: '⛏️' },
  { key: 'wood' as const, label: 'Wood', emoji: '🪵' },
  { key: 'gems' as const, label: 'Gems', emoji: '💎' },
  { key: 'coins' as const, label: 'Coins', emoji: '🪙' },
  { key: 'reputation' as const, label: 'Reputation', emoji: '⭐' },
];

export function ResourceBar({ resources }: ResourceBarProps) {
  return (
    <div className="resource-bar" role="region" aria-label="Resources">
      {RESOURCE_CONFIG.map(({ key, label, emoji }) => (
        <div key={key} className="resource-chip" title={label}>
          <span className="resource-emoji" aria-hidden="true">{emoji}</span>
          <span className="resource-label">{label}</span>
          <span className="resource-value">{formatNumber(resources[key])}</span>
        </div>
      ))}
    </div>
  );
}
