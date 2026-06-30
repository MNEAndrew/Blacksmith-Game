import type { ForgeContract } from '../types/contracts';
import { formatContractRequirements } from '../utils/contractCalculations';
import { formatNumber } from '../utils/gameLogic';

interface ContractCardProps {
  contract: ForgeContract;
  now: number;
  slotsFull: boolean;
  onAccept: (contractId: string) => void;
}

function formatTimer(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${seconds}s`;
}

export function ContractCard({ contract, now, slotsFull, onAccept }: ContractCardProps) {
  const remainingMs = contract.offerExpiresAt - now;
  const highRisk = contract.difficulty === 'hard' || contract.difficulty === 'legendary';

  const handleAccept = () => {
    if (highRisk) {
      const confirmed = window.confirm(
        `Accept ${contract.difficulty} contract "${contract.title}"? Failure costs ${contract.failureCoinPenalty} coins and ${contract.failureReputationPenalty} reputation.`,
      );
      if (!confirmed) return;
    }
    onAccept(contract.id);
  };

  return (
    <article className={`contract-card contract-card--${contract.difficulty}`}>
      <div className="contract-card__topline">
        <span className={`contract-badge contract-badge--${contract.difficulty}`}>{contract.difficulty}</span>
        <span className={`risk-badge risk-badge--${contract.riskLevel}`}>{contract.riskLevel} risk</span>
        <strong className="contract-timer">{formatTimer(remainingMs)}</strong>
      </div>
      <h3>{contract.title}</h3>
      <p className="contract-card__client">{contract.clientName} - {contract.clientType}</p>
      <p className="contract-card__description">{contract.description}</p>
      <p className="contract-card__flavor">{contract.flavorText}</p>

      <div className="contract-requirements">
        <span>Required</span>
        <strong>{formatContractRequirements(contract.requirements)}</strong>
      </div>

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
          <span>Penalty</span>
          <strong className="contract-danger">{formatNumber(contract.failureCoinPenalty)} coins</strong>
        </div>
        <div>
          <span>Payout</span>
          <strong>{contract.rewardMultiplier.toFixed(1)}x</strong>
        </div>
      </div>

      <button
        type="button"
        className="craft-btn"
        onClick={handleAccept}
        disabled={slotsFull || remainingMs <= 0}
        aria-label={`Accept ${contract.title}`}
      >
        {slotsFull ? 'No Active Slot' : 'Accept Contract'}
      </button>
    </article>
  );
}
