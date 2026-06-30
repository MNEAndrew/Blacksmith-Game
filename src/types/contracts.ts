import type { CraftableCategory, Rarity } from './game';

export type ContractClientType =
  | 'company'
  | 'guild'
  | 'kingdom'
  | 'republic'
  | 'merchant'
  | 'military'
  | 'research';

export type ContractDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export type ContractStatus = 'available' | 'active' | 'completed' | 'failed' | 'expired';

export type ContractRiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export interface ContractRequirement {
  itemId: string;
  quantity: number;
}

export interface ForgeContract {
  id: string;
  clientName: string;
  clientType: ContractClientType;
  title: string;
  description: string;
  requirements: ContractRequirement[];
  difficulty: ContractDifficulty;
  rewardMultiplier: number;
  rewardCoins: number;
  reputationReward: number;
  failureCoinPenalty: number;
  failureReputationPenalty: number;
  offerExpiresAt: number;
  activeExpiresAt: number | null;
  status: ContractStatus;
  createdAt: number;
  acceptedAt: number | null;
  completedAt: number | null;
  flavorText: string;
  riskLevel: ContractRiskLevel;
  categoryHint?: CraftableCategory;
  rarityHint?: Rarity;
  completedWithSecondsRemaining?: number;
}

export interface ContractStats {
  completed: number;
  failed: number;
  expired: number;
  coinsEarned: number;
  reputationEarned: number;
  reputationLost: number;
  penaltiesPaid: number;
  largestReward: number;
  worstPenalty: number;
  slotsUnlocked: number;
  legendaryCompleted: number;
  deadlineSurvivorCompletions: number;
  currentCompletionStreak: number;
  bestCompletionStreak: number;
}

export interface ContractsState {
  availableContracts: ForgeContract[];
  activeContracts: ForgeContract[];
  contractHistory: ForgeContract[];
  lastContractGeneratedAt: number | null;
  activeContractSlots: number;
  maxActiveContractSlots: number;
  unlockedContractSlots: number;
  contractStats: ContractStats;
}

export const CONTRACT_OFFER_DURATION_MS = 30_000;
export const CONTRACT_TICK_MS = 1_000;
export const MIN_AVAILABLE_CONTRACTS = 3;
export const TARGET_AVAILABLE_CONTRACTS = 4;
export const MAX_AVAILABLE_CONTRACTS = 5;
export const MAX_ACTIVE_CONTRACT_SLOTS = 3;
export const CONTRACT_HISTORY_LIMIT = 24;

export const CONTRACT_SLOT_COSTS: Record<number, number> = {
  2: 10_000,
  3: 100_000,
};

export const CONTRACT_ACTIVE_DURATION_MS: Record<ContractDifficulty, number> = {
  easy: 7 * 60_000,
  medium: 6 * 60_000,
  hard: 5 * 60_000,
  legendary: 5 * 60_000,
};

export const CONTRACT_REWARD_MULTIPLIERS: Record<ContractDifficulty, number> = {
  easy: 2,
  medium: 2.3,
  hard: 2.6,
  legendary: 3,
};

export const INITIAL_CONTRACT_STATS: ContractStats = {
  completed: 0,
  failed: 0,
  expired: 0,
  coinsEarned: 0,
  reputationEarned: 0,
  reputationLost: 0,
  penaltiesPaid: 0,
  largestReward: 0,
  worstPenalty: 0,
  slotsUnlocked: 1,
  legendaryCompleted: 0,
  deadlineSurvivorCompletions: 0,
  currentCompletionStreak: 0,
  bestCompletionStreak: 0,
};

export const INITIAL_CONTRACTS_STATE: ContractsState = {
  availableContracts: [],
  activeContracts: [],
  contractHistory: [],
  lastContractGeneratedAt: null,
  activeContractSlots: 1,
  maxActiveContractSlots: MAX_ACTIVE_CONTRACT_SLOTS,
  unlockedContractSlots: 1,
  contractStats: { ...INITIAL_CONTRACT_STATS },
};
