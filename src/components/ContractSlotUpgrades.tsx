import { CONTRACT_SLOT_COSTS, MAX_ACTIVE_CONTRACT_SLOTS } from '../types/contracts';
import type { GameState } from '../types/game';
import { formatNumber } from '../utils/gameLogic';

interface ContractSlotUpgradesProps {
  state: GameState;
  onUnlockSlot: () => void;
}

export function ContractSlotUpgrades({ state, onUnlockSlot }: ContractSlotUpgradesProps) {
  const slots = Math.min(MAX_ACTIVE_CONTRACT_SLOTS, state.contracts.unlockedContractSlots);
  const nextSlot = slots + 1;
  const nextCost = CONTRACT_SLOT_COSTS[nextSlot];
  const canBuy = !!nextCost && state.resources.coins >= nextCost;

  return (
    <section className="panel contracts-section contract-slots-panel" aria-labelledby="contract-slots-heading">
      <h2 id="contract-slots-heading">Active Contract Slots</h2>
      <p className="panel-subtitle">Accepted contracts reserve a slot until completed or failed.</p>
      <div className="contract-slot-summary">
        <div>
          <span>Active Slots</span>
          <strong>{slots} / {MAX_ACTIVE_CONTRACT_SLOTS}</strong>
        </div>
        <div>
          <span>Current Active</span>
          <strong>{state.contracts.activeContracts.length}</strong>
        </div>
      </div>
      {slots >= MAX_ACTIVE_CONTRACT_SLOTS ? (
        <p className="contract-ready">All active contract slots are unlocked.</p>
      ) : (
        <button
          type="button"
          className="craft-btn"
          onClick={onUnlockSlot}
          disabled={!canBuy}
          aria-label={`Unlock Contract Slot ${nextSlot}`}
        >
          Unlock Slot {nextSlot} - {formatNumber(nextCost ?? 0)} coins
        </button>
      )}
      <div className="contract-slot-list" aria-label="Contract slot unlocks">
        {[1, 2, 3].map((slot) => (
          <span key={slot} className={slot <= slots ? 'contract-slot contract-slot--owned' : 'contract-slot'}>
            Slot {slot}: {slot === 1 ? 'Starter' : `${formatNumber(CONTRACT_SLOT_COSTS[slot])} coins`}
          </span>
        ))}
      </div>
    </section>
  );
}
