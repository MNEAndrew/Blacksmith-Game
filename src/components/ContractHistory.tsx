import type { ForgeContract } from '../types/contracts';
import { formatContractRequirements } from '../utils/contractCalculations';
import { formatNumber } from '../utils/gameLogic';

interface ContractHistoryProps {
  contracts: ForgeContract[];
}

function formatDate(value: number | null): string {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ContractHistory({ contracts }: ContractHistoryProps) {
  return (
    <section className="panel contracts-section" aria-labelledby="contract-history-heading">
      <h2 id="contract-history-heading">Completed / Failed / Expired History</h2>
      <p className="panel-subtitle">Recent contract outcomes from the trade board.</p>
      {contracts.length === 0 ? (
        <p className="empty-state">No contract history yet.</p>
      ) : (
        <div className="contract-history-list">
          {contracts.slice(0, 20).map((contract) => (
            <article key={`${contract.id}-${contract.status}`} className={`contract-history-row contract-history-row--${contract.status}`}>
              <div>
                <span className={`contract-status contract-status--${contract.status}`}>{contract.status}</span>
                <strong>{contract.title}</strong>
                <span>{contract.clientName}</span>
              </div>
              <div>
                <span>{formatContractRequirements(contract.requirements)}</span>
                <span>
                  {contract.status === 'completed'
                    ? `${formatNumber(contract.rewardCoins)} coins`
                    : `${formatNumber(contract.failureCoinPenalty)} penalty`}
                </span>
                <span>{formatDate(contract.completedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
