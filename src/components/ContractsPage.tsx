import { useEffect, useState } from 'react';
import { ActiveContractCard } from './ActiveContractCard';
import { ContractCard } from './ContractCard';
import { ContractHistory } from './ContractHistory';
import { ContractSlotUpgrades } from './ContractSlotUpgrades';
import { ContractStatsPanel } from './ContractStatsPanel';
import { ResourceBar } from './ResourceBar';
import type { GameState } from '../types/game';
import { formatNumber } from '../utils/gameLogic';

interface ContractsPageProps {
  state: GameState;
  onAcceptContract: (contractId: string) => void;
  onDeliverContract: (contractId: string) => void;
  onUnlockContractSlot: () => void;
}

function OverviewTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="contract-overview-tile">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

export function ContractsPage({
  state,
  onAcceptContract,
  onDeliverContract,
  onUnlockContractSlot,
}: ContractsPageProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = state.contracts.contractStats;
  const resolvedContracts = stats.completed + stats.failed;
  const successRate = resolvedContracts > 0 ? Math.round((stats.completed / resolvedContracts) * 100) : 0;
  const slotsFull = state.contracts.activeContracts.length >= state.contracts.unlockedContractSlots;

  return (
    <main className="contracts-page">
      <ResourceBar state={state} />

      <section className="contracts-hero">
        <div>
          <p className="contracts-hero__eyebrow">Forge Trade Board</p>
          <h2>Contracts</h2>
          <p>Timed fictional orders from guilds, kingdoms, republics, companies, and expeditions.</p>
        </div>
        <div className="contracts-hero__summary">
          <span>{state.contracts.activeContracts.length} active</span>
          <span>{state.contracts.availableContracts.length} available</span>
        </div>
      </section>

      <section className="panel contracts-section" aria-labelledby="contract-overview-heading">
        <h2 id="contract-overview-heading">Contract Overview</h2>
        <div className="contract-overview-grid">
          <OverviewTile label="Active Slots" value={`${state.contracts.unlockedContractSlots} / 3`} />
          <OverviewTile label="Active Contracts" value={formatNumber(state.contracts.activeContracts.length)} />
          <OverviewTile label="Completed" value={formatNumber(stats.completed)} />
          <OverviewTile label="Failed" value={formatNumber(stats.failed)} />
          <OverviewTile label="Success Rate" value={`${successRate}%`} />
          <OverviewTile label="Coins Earned" value={formatNumber(stats.coinsEarned)} />
          <OverviewTile label="Rep Earned" value={formatNumber(stats.reputationEarned)} />
          <OverviewTile label="Rep Lost" value={formatNumber(stats.reputationLost)} />
        </div>
      </section>

      <div className="contracts-layout">
        <div className="contracts-main-column">
          <section className="panel contracts-section" aria-labelledby="available-contracts-heading">
            <div className="panel-header-row">
              <div>
                <h2 id="available-contracts-heading">Available Contracts</h2>
                <p className="panel-subtitle">Postings expire after 30 seconds if not accepted.</p>
              </div>
            </div>
            {state.contracts.availableContracts.length === 0 ? (
              <p className="empty-state">The trade board is being restocked.</p>
            ) : (
              <div className="contract-card-grid">
                {state.contracts.availableContracts.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    now={now}
                    slotsFull={slotsFull}
                    onAccept={onAcceptContract}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="panel contracts-section" aria-labelledby="active-contracts-heading">
            <h2 id="active-contracts-heading">Active Contracts</h2>
            <p className="panel-subtitle">Accepted contracts fail automatically when their delivery timer reaches zero.</p>
            {state.contracts.activeContracts.length === 0 ? (
              <p className="empty-state">No active contracts. Accept one from the board when your forge is ready.</p>
            ) : (
              <div className="contract-card-grid">
                {state.contracts.activeContracts.map((contract) => (
                  <ActiveContractCard
                    key={contract.id}
                    contract={contract}
                    state={state}
                    now={now}
                    onDeliver={onDeliverContract}
                  />
                ))}
              </div>
            )}
          </section>

          <ContractHistory contracts={state.contracts.contractHistory} />
        </div>

        <aside className="contracts-side-column">
          <ContractSlotUpgrades state={state} onUnlockSlot={onUnlockContractSlot} />
          <ContractStatsPanel state={state} />
        </aside>
      </div>
    </main>
  );
}
