import type { ForgeContract } from '../types/contracts';
import type { GameState } from '../types/game';
import {
  formatContractRequirements,
  getMissingContractItems,
} from '../utils/contractCalculations';
import { formatNumber } from '../utils/gameLogic';

interface ActiveContractCardProps {
  contract: ForgeContract;
  state: GameState;
  now: number;
  onDeliver: (contractId: string) => void;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

export function ActiveContractCard({ contract, state, now, onDeliver }: ActiveContractCardProps) {
  const remainingMs = contract.activeExpiresAt ? contract.activeExpiresAt - now : 0;
  const missing = getMissingContractItems(contract, state);
  const canDeliver = missing.length === 0 && remainingMs > 0;
  const urgent = remainingMs <= 30_000;

  return (
    <article className={`contract-card contract-card--active contract-card--${contract.difficulty} ${urgent ? 'contract-card--urgent' : ''}`}>
      <div className="contract-card__topline">
        <span className={`contract-badge contract-badge--${contract.difficulty}`}>{contract.difficulty}</span>
        <span className="slot-badge">Slot used</span>
        <strong className={`contract-timer ${urgent ? 'contract-timer--urgent' : ''}`}>
          {formatCountdown(remainingMs)}
        </strong>
      </div>
      <h3>{contract.title}</h3>
      <p className="contract-card__client">{contract.clientName}</p>

      <div className="contract-requirements">
        <span>Deliver</span>
        <strong>{formatContractRequirements(contract.requirements)}</strong>
      </div>

      {missing.length > 0 ? (
        <div className="contract-missing">
          <span>Missing items</span>
          {missing.map((item) => (
            <strong key={item.itemId}>
              {item.name}: {formatNumber(item.available)} / {formatNumber(item.required)}
            </strong>
          ))}
        </div>
      ) : (
        <p className="contract-ready">All required items are ready.</p>
      )}

      <div className="contract-payout-grid">
        <div>
          <span>Reward</span>
          <strong>{formatNumber(contract.rewardCoins)} coins</strong>
        </div>
        <div>
          <span>Reputation</span>
          <strong>+{formatNumber(contract.reputationReward)}</strong>
        </div>
        <div>
          <span>Failure cost</span>
          <strong className="contract-danger">{formatNumber(contract.failureCoinPenalty)} coins</strong>
        </div>
        <div>
          <span>Rep loss</span>
          <strong className="contract-danger">-{formatNumber(contract.failureReputationPenalty)}</strong>
        </div>
      </div>

      <button
        type="button"
        className="craft-btn"
        onClick={() => onDeliver(contract.id)}
        disabled={!canDeliver}
        aria-label={`Deliver ${contract.title}`}
      >
        {canDeliver ? 'Deliver Contract' : 'Missing Items'}
      </button>
    </article>
  );
}
