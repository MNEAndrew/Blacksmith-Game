import { CONTRACT_CLIENTS, CONTRACT_FLAVOR_LINES, CONTRACT_TYPES, type ContractClient } from '../data/contractClients';
import { CRAFTABLE_ITEMS } from '../data/items';
import type {
  ContractDifficulty,
  ContractRequirement,
  ContractRiskLevel,
  ForgeContract,
} from '../types/contracts';
import {
  CONTRACT_OFFER_DURATION_MS,
  CONTRACT_REWARD_MULTIPLIERS,
} from '../types/contracts';
import type { CraftableCategory, CraftableItem, GameModifiers, GameState, Rarity } from '../types/game';
import { CRAFTABLE_CATEGORY_LABELS } from '../types/game';
import type { NewsEvent } from '../types/news';
import { calculateContractTotals } from './contractCalculations';
import { isItemUnlocked } from './gameLogic';

const RARITY_SCORE: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  mythic: 6,
};

const DIFFICULTY_RARITIES: Record<ContractDifficulty, Rarity[]> = {
  easy: ['common'],
  medium: ['common', 'uncommon', 'rare'],
  hard: ['uncommon', 'rare', 'epic', 'legendary'],
  legendary: ['rare', 'epic', 'legendary', 'mythic'],
};

const DIFFICULTY_QUANTITY_RANGE: Record<ContractDifficulty, [number, number]> = {
  easy: [20, 40],
  medium: [40, 80],
  hard: [60, 100],
  legendary: [80, 120],
};

const DIFFICULTY_RISK: Record<ContractDifficulty, ContractRiskLevel> = {
  easy: 'low',
  medium: 'moderate',
  hard: 'high',
  legendary: 'severe',
};

function pick<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randomId(now: number): string {
  return `contract-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getProgressTier(state: GameState): 'early' | 'mid' | 'late' {
  if (state.resources.reputation >= 1_000 || state.stats.totalItemsCrafted >= 300) return 'late';
  if (state.resources.reputation >= 120 || state.stats.totalItemsCrafted >= 75) return 'mid';
  return 'early';
}

function chooseDifficulty(state: GameState): ContractDifficulty {
  const tier = getProgressTier(state);
  const roll = Math.random();

  if (tier === 'early') {
    if (roll < 0.75) return 'easy';
    return 'medium';
  }

  if (tier === 'mid') {
    if (roll < 0.42) return 'easy';
    if (roll < 0.82) return 'medium';
    return 'hard';
  }

  if (roll < 0.25) return 'medium';
  if (roll < 0.78) return 'hard';
  if (roll < 0.94) return 'easy';
  return 'legendary';
}

function getNewsBias(activeNewsEvents: NewsEvent[]): {
  category?: CraftableCategory;
  client?: ContractClient;
  title?: string;
  rewardBonus: number;
  penaltyMultiplier: number;
} {
  const event = activeNewsEvents[0];
  if (!event) return { rewardBonus: 0, penaltyMultiplier: 1 };

  if (event.type === 'war') {
    return {
      category: Math.random() > 0.35 ? 'melee' : 'ranged',
      client: { name: 'Sunspire Defense Council', type: 'military' },
      title: 'Military supply order',
      rewardBonus: 0.15,
      penaltyMultiplier: 1.1,
    };
  }

  if (event.type === 'disaster') {
    return {
      category: 'tools',
      title: 'Emergency disaster relief order',
      rewardBonus: 0.1,
      penaltyMultiplier: 1,
    };
  }

  if (event.type === 'industry') {
    return {
      category: 'tools',
      client: { name: 'Northreach Mining Union', type: 'guild' },
      title: 'Mining tool order',
      rewardBonus: 0.1,
      penaltyMultiplier: 1,
    };
  }

  if (event.type === 'market') {
    return {
      client: { name: 'Crystal Harbor Merchants', type: 'merchant' },
      title: 'Trade convoy supply order',
      rewardBonus: 0.15,
      penaltyMultiplier: 1.2,
    };
  }

  if (event.type === 'scandal') {
    return {
      rewardBonus: 0,
      penaltyMultiplier: 1.25,
    };
  }

  return { rewardBonus: 0, penaltyMultiplier: 1 };
}

function getEligibleItems(
  state: GameState,
  difficulty: ContractDifficulty,
  categoryBias?: CraftableCategory,
): CraftableItem[] {
  const allowedRarities = DIFFICULTY_RARITIES[difficulty];
  const unlocked = CRAFTABLE_ITEMS.filter((item) => isItemUnlocked(item, state));
  const filtered = unlocked
    .filter((item) => allowedRarities.includes(item.rarity))
    .filter((item) => !categoryBias || item.category === categoryBias);

  if (filtered.length > 0) return filtered;

  const fallback = unlocked.filter((item) => !categoryBias || item.category === categoryBias);
  if (fallback.length > 0) return fallback;

  return unlocked.length > 0 ? unlocked : CRAFTABLE_ITEMS.filter((item) => item.pickaxeMaterial === 'wood');
}

function chooseRequirements(
  state: GameState,
  difficulty: ContractDifficulty,
  categoryBias?: CraftableCategory,
): ContractRequirement[] {
  const candidates = getEligibleItems(state, difficulty, categoryBias);
  const itemCount = difficulty === 'easy' ? 1 : randomInt(1, difficulty === 'legendary' ? 3 : 2);
  const selected: CraftableItem[] = [];

  while (selected.length < itemCount && selected.length < candidates.length) {
    const item = pick(candidates);
    if (!selected.some((selectedItem) => selectedItem.id === item.id)) selected.push(item);
  }

  const [minQuantity, maxQuantity] = DIFFICULTY_QUANTITY_RANGE[difficulty];
  const totalQuantity = randomInt(minQuantity, maxQuantity);
  const baseQuantity = Math.max(1, Math.floor(totalQuantity / Math.max(1, selected.length)));

  return selected.map((item, index) => ({
    itemId: item.id,
    quantity: Math.max(1, index === selected.length - 1
      ? totalQuantity - baseQuantity * (selected.length - 1)
      : baseQuantity),
  }));
}

function getRequirementSummary(requirements: ContractRequirement[]): {
  categoryHint?: CraftableCategory;
  rarityHint?: Rarity;
} {
  const items = requirements
    .map((requirement) => CRAFTABLE_ITEMS.find((item) => item.id === requirement.itemId))
    .filter((item): item is CraftableItem => item !== undefined);
  const categoryHint = items.length > 0 && items.every((item) => item.category === items[0].category)
    ? items[0].category
    : undefined;
  const rarityHint = items
    .slice()
    .sort((a, b) => RARITY_SCORE[b.rarity] - RARITY_SCORE[a.rarity])[0]?.rarity;

  return { categoryHint, rarityHint };
}

function getTitle(baseTitle: string, categoryHint?: CraftableCategory): string {
  if (!categoryHint) return baseTitle;

  const category = CRAFTABLE_CATEGORY_LABELS[categoryHint];
  if (baseTitle.toLowerCase().includes(category.toLowerCase())) return baseTitle;
  return `${category} ${baseTitle.toLowerCase()}`;
}

export function generateContract(
  state: GameState,
  modifiers: GameModifiers,
  now = Date.now(),
): ForgeContract {
  const newsBias = getNewsBias(state.news.activeEvents);
  const difficulty = chooseDifficulty(state);
  const requirements = chooseRequirements(state, difficulty, newsBias.category);
  const { categoryHint, rarityHint } = getRequirementSummary(requirements);
  const rewardMultiplier = CONTRACT_REWARD_MULTIPLIERS[difficulty] + newsBias.rewardBonus;
  const totals = calculateContractTotals(requirements, rewardMultiplier, modifiers);
  const client = newsBias.client ?? pick(CONTRACT_CLIENTS);
  const baseTitle = newsBias.title ?? pick([...CONTRACT_TYPES]);
  const title = getTitle(baseTitle, categoryHint);
  const penaltyMultiplier = newsBias.penaltyMultiplier;

  return {
    id: randomId(now),
    clientName: client.name,
    clientType: client.type,
    title,
    description: `${client.name} needs a timed shipment from your forge. Deliver every listed item before the accepted deadline or pay the posted penalty.`,
    requirements,
    difficulty,
    rewardMultiplier,
    rewardCoins: totals.rewardCoins,
    reputationReward: totals.reputationReward,
    failureCoinPenalty: Math.floor(totals.failureCoinPenalty * penaltyMultiplier),
    failureReputationPenalty: Math.floor(totals.failureReputationPenalty * penaltyMultiplier),
    offerExpiresAt: now + CONTRACT_OFFER_DURATION_MS,
    activeExpiresAt: null,
    status: 'available',
    createdAt: now,
    acceptedAt: null,
    completedAt: null,
    flavorText: pick(CONTRACT_FLAVOR_LINES),
    riskLevel: DIFFICULTY_RISK[difficulty],
    categoryHint,
    rarityHint,
  };
}
