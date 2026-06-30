import { ITEMS_BY_ID } from '../data/items';
import type { ContractRequirement, ForgeContract } from '../types/contracts';
import type { GameModifiers, GameState } from '../types/game';
import { getReputationGain, getSellPrice } from './gameLogic';

export interface ContractTotals {
  normalValue: number;
  normalReputation: number;
  rewardCoins: number;
  reputationReward: number;
  potentialProfit: number;
  failureCoinPenalty: number;
  failureReputationPenalty: number;
}

export interface MissingContractItem {
  itemId: string;
  name: string;
  required: number;
  available: number;
  missing: number;
}

function safeInventoryCount(value: number | undefined): number {
  return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : 0;
}

export function getInventoryQuantity(state: GameState, itemId: string): number {
  return safeInventoryCount(state.inventory[itemId]);
}

export function getContractNormalValue(requirements: ContractRequirement[], modifiers: GameModifiers): number {
  return requirements.reduce((sum, requirement) => {
    const item = ITEMS_BY_ID[requirement.itemId];
    if (!item) return sum;
    return sum + getSellPrice(item, modifiers) * requirement.quantity;
  }, 0);
}

export function getContractNormalReputation(requirements: ContractRequirement[], modifiers: GameModifiers): number {
  return requirements.reduce((sum, requirement) => {
    const item = ITEMS_BY_ID[requirement.itemId];
    if (!item) return sum;
    return sum + getReputationGain(item, modifiers) * requirement.quantity;
  }, 0);
}

export function calculateContractTotals(
  requirements: ContractRequirement[],
  rewardMultiplier: number,
  modifiers: GameModifiers,
): ContractTotals {
  const normalValue = getContractNormalValue(requirements, modifiers);
  const normalReputation = getContractNormalReputation(requirements, modifiers);
  const rewardCoins = Math.max(1, Math.floor(normalValue * rewardMultiplier));
  const reputationReward = Math.max(1, Math.floor(normalReputation * Math.max(1.25, rewardMultiplier * 0.85)));
  const potentialProfit = Math.max(0, rewardCoins - normalValue);
  const failureCoinPenalty = Math.floor(potentialProfit * 2);
  const failureReputationPenalty = Math.max(2, Math.floor(reputationReward * 0.65));

  return {
    normalValue,
    normalReputation,
    rewardCoins,
    reputationReward,
    potentialProfit,
    failureCoinPenalty,
    failureReputationPenalty,
  };
}

export function getMissingContractItems(contract: ForgeContract, state: GameState): MissingContractItem[] {
  return contract.requirements
    .map((requirement) => {
      const item = ITEMS_BY_ID[requirement.itemId];
      const available = getInventoryQuantity(state, requirement.itemId);
      const required = Math.max(0, Math.floor(requirement.quantity));
      const missing = Math.max(0, required - available);

      return {
        itemId: requirement.itemId,
        name: item?.name ?? requirement.itemId,
        required,
        available,
        missing,
      };
    })
    .filter((item) => item.missing > 0);
}

export function canFulfillContract(contract: ForgeContract, state: GameState): boolean {
  return getMissingContractItems(contract, state).length === 0;
}

export function removeInventoryItems(
  inventory: GameState['inventory'],
  requirements: ContractRequirement[],
): GameState['inventory'] {
  const next = { ...inventory };

  for (const requirement of requirements) {
    const current = safeInventoryCount(next[requirement.itemId]);
    const quantity = Math.max(0, Math.floor(requirement.quantity));
    const remaining = Math.max(0, current - quantity);

    if (remaining > 0) next[requirement.itemId] = remaining;
    else delete next[requirement.itemId];
  }

  return next;
}

export function formatContractRequirements(requirements: ContractRequirement[]): string {
  return requirements
    .map((requirement) => {
      const item = ITEMS_BY_ID[requirement.itemId];
      return `${requirement.quantity}x ${item?.name ?? requirement.itemId}`;
    })
    .join(' + ');
}

export function formatMissingContractItems(missing: MissingContractItem[]): string {
  return missing
    .map((item) => `${item.name}: need ${item.missing} more`)
    .join(', ');
}
