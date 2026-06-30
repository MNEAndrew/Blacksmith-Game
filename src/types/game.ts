import type { NewsEvent, NewsState } from './news';

export const MATERIAL_ORDER = [
  'wood',
  'stone',
  'copper',
  'iron',
  'gold',
  'emerald',
  'diamond',
  'ruby',
  'mithril',
] as const;

export type MaterialKey = typeof MATERIAL_ORDER[number];

export type EconomyResourceKey = 'coins' | 'reputation';

export type ResourceKey = MaterialKey | EconomyResourceKey;

export type Resources = Record<ResourceKey, number>;

export type MaterialUnlocks = Record<MaterialKey, boolean>;

export const MATERIAL_LABELS: Record<MaterialKey, string> = {
  wood: 'Wood',
  stone: 'Stone',
  copper: 'Copper',
  iron: 'Iron',
  gold: 'Gold',
  emerald: 'Emerald',
  diamond: 'Diamond',
  ruby: 'Ruby',
  mithril: 'Mithril',
};

export const SPECIALIST_MATERIALS: MaterialKey[] = [
  'gold',
  'emerald',
  'diamond',
  'ruby',
  'mithril',
];

export const GEM_ORDER = [
  'crude',
  'mediocre',
  'polished',
  'precious',
] as const;

export type GemKey = typeof GEM_ORDER[number];

export type GemInventory = Record<GemKey, number>;

export const GEM_LABELS: Record<GemKey, string> = {
  crude: 'Crude Gem',
  mediocre: 'Mediocre Gem',
  polished: 'Polished Gem',
  precious: 'Precious Gem',
};

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type CraftableCategory = 'tools' | 'melee' | 'ranged' | 'armor' | 'accessories';

export type CraftSource = 'manual' | 'auto';

export const CRAFTABLE_CATEGORY_LABELS: Record<CraftableCategory, string> = {
  tools: 'Tools',
  melee: 'Melee',
  ranged: 'Ranged',
  armor: 'Armor',
  accessories: 'Accessories',
};

export interface PickaxeCraftRequirement {
  material: MaterialKey;
  count: number;
}

export interface UnlockRequirement {
  coinsEarned?: number;
  reputation?: number;
  upgradeId?: string;
  pickaxeCraft?: PickaxeCraftRequirement;
  materialUnlocked?: MaterialKey;
}

export interface CraftableItem {
  id: string;
  name: string;
  description: string;
  requiredResources: Partial<Resources>;
  requiredGems?: Partial<GemInventory>;
  requiredCraftTimeMs?: number;
  coinValue: number;
  reputationGain: number;
  unlockRequirement: UnlockRequirement;
  emoji: string;
  rarity: Rarity;
  category: CraftableCategory;
  pickaxeMaterial?: MaterialKey;
}

export type UpgradeEffectType =
  | 'materialPerClick'
  | 'sellMultiplier'
  | 'materialPerSecond'
  | 'automationSpeed'
  | 'reputationMultiplier'
  | 'minerSpecialist'
  | 'treasureHunter';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  effectType: UpgradeEffectType;
  effectPerLevel: number;
  maxLevel: number;
  materialKey?: MaterialKey;
  unlockRequirement?: UnlockRequirement;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  check: (state: GameState) => boolean;
}

export interface GameStats {
  totalClicks: number;
  totalItemsCrafted: number;
  totalCoinsEarned: number;
  totalUpgradesPurchased: number;
  totalGemsPolished: number;
  manualCrafts: number;
  autoCrafts: number;
  craftedByItem: Record<string, number>;
  craftedByRarity: Record<Rarity, number>;
  craftedByCollection: Record<CraftableCategory, number>;
  resourcesGainedManual: Record<MaterialKey, number>;
  resourcesGainedAuto: Record<MaterialKey, number>;
  coinsSpentOnUpgrades: number;
  totalItemsSold: number;
  totalCoinsFromSelling: number;
  firstPlayedAt: string;
  lastSavedAt: string | null;
  bestProductionPerSecond: number;
  bestSyncedReputation: number;
  lastSyncedAt: string | null;
  totalNewsEventsSeen: number;
  mostImpactfulNewsEventHeadline: string | null;
  timeUnderPositiveNewsMs: number;
  timeUnderNegativeNewsMs: number;
  coinsGainedFromEventBonuses: number;
  reputationGainedFromEventBonuses: number;
}

export interface BlacksmithExpert {
  id: string;
  name: string;
  unlocked: boolean;
  assignedCraftableId: string | null;
  craftSpeedMultiplier: number;
  autoCraftEnabled: boolean;
}

export interface CraftProgress {
  itemId: string;
  elapsedMs: number;
  requiredMs: number;
  source: CraftSource;
  expertId?: string;
}

export interface TreasureHunterState {
  unlocked: boolean;
  level: number;
}

export interface GameState {
  resources: Resources;
  materialUnlocks: MaterialUnlocks;
  gemInventory: GemInventory;
  treasureHunter: TreasureHunterState;
  inventory: Record<string, number>;
  craftedCounts: Record<string, number>;
  upgradeLevels: Record<string, number>;
  stats: GameStats;
  achievementsUnlocked: Record<string, boolean>;
  blacksmithExperts: BlacksmithExpert[];
  activeCraftingSpecialists: Record<string, boolean>;
  activeCrafts: Record<string, CraftProgress>;
  news: NewsState;
}

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'info' | 'warning';
}

export interface FloatingTextItem {
  id: number;
  text: string;
  x: number;
  y: number;
}

export interface GameModifiers {
  gatherPerClick: Record<MaterialKey, number>;
  materialPerSecond: Record<MaterialKey, number>;
  sellMultiplier: number;
  categorySellMultipliers: Record<CraftableCategory, number>;
  specificItemValueMultipliers: Record<string, number>;
  automationSpeed: number;
  craftSpeedMultiplier: number;
  categoryCraftSpeedMultipliers: Record<CraftableCategory, number>;
  specificItemCraftSpeedMultipliers: Record<string, number>;
  reputationMultiplier: number;
  upgradeCostMultiplier: number;
  activeNewsEvents: NewsEvent[];
  eventEffectSummaries: string[];
}

export const INITIAL_RESOURCES: Resources = {
  wood: 0,
  stone: 0,
  copper: 0,
  iron: 0,
  gold: 0,
  emerald: 0,
  diamond: 0,
  ruby: 0,
  mithril: 0,
  coins: 25,
  reputation: 0,
};

export const INITIAL_MATERIAL_UNLOCKS: MaterialUnlocks = {
  wood: true,
  stone: false,
  copper: false,
  iron: false,
  gold: false,
  emerald: false,
  diamond: false,
  ruby: false,
  mithril: false,
};

export const INITIAL_GEM_INVENTORY: GemInventory = {
  crude: 0,
  mediocre: 0,
  polished: 0,
  precious: 0,
};

export const INITIAL_RARITY_COUNTS: Record<Rarity, number> = {
  common: 0,
  uncommon: 0,
  rare: 0,
  epic: 0,
  legendary: 0,
  mythic: 0,
};

export const INITIAL_CATEGORY_COUNTS: Record<CraftableCategory, number> = {
  tools: 0,
  melee: 0,
  ranged: 0,
  armor: 0,
  accessories: 0,
};

export function createEmptyMaterialTotals(): Record<MaterialKey, number> {
  return Object.fromEntries(MATERIAL_ORDER.map((material) => [material, 0])) as Record<MaterialKey, number>;
}

export const INITIAL_STATS: GameStats = {
  totalClicks: 0,
  totalItemsCrafted: 0,
  totalCoinsEarned: 0,
  totalUpgradesPurchased: 0,
  totalGemsPolished: 0,
  manualCrafts: 0,
  autoCrafts: 0,
  craftedByItem: {},
  craftedByRarity: { ...INITIAL_RARITY_COUNTS },
  craftedByCollection: { ...INITIAL_CATEGORY_COUNTS },
  resourcesGainedManual: createEmptyMaterialTotals(),
  resourcesGainedAuto: createEmptyMaterialTotals(),
  coinsSpentOnUpgrades: 0,
  totalItemsSold: 0,
  totalCoinsFromSelling: 0,
  firstPlayedAt: new Date().toISOString(),
  lastSavedAt: null,
  bestProductionPerSecond: 0,
  bestSyncedReputation: 0,
  lastSyncedAt: null,
  totalNewsEventsSeen: 0,
  mostImpactfulNewsEventHeadline: null,
  timeUnderPositiveNewsMs: 0,
  timeUnderNegativeNewsMs: 0,
  coinsGainedFromEventBonuses: 0,
  reputationGainedFromEventBonuses: 0,
};

export const INITIAL_BLACKSMITH_EXPERTS: BlacksmithExpert[] = [
  {
    id: 'apprentice-smith',
    name: 'Apprentice Smith',
    unlocked: false,
    assignedCraftableId: null,
    craftSpeedMultiplier: 1,
    autoCraftEnabled: true,
  },
];

export function createInitialState(): GameState {
  return {
    resources: { ...INITIAL_RESOURCES },
    materialUnlocks: { ...INITIAL_MATERIAL_UNLOCKS },
    gemInventory: { ...INITIAL_GEM_INVENTORY },
    treasureHunter: {
      unlocked: false,
      level: 0,
    },
    inventory: {},
    craftedCounts: {},
    upgradeLevels: {},
    stats: {
      ...INITIAL_STATS,
      craftedByItem: {},
      craftedByRarity: { ...INITIAL_RARITY_COUNTS },
      craftedByCollection: { ...INITIAL_CATEGORY_COUNTS },
      resourcesGainedManual: createEmptyMaterialTotals(),
      resourcesGainedAuto: createEmptyMaterialTotals(),
      firstPlayedAt: new Date().toISOString(),
      lastSavedAt: null,
      lastSyncedAt: null,
    },
    achievementsUnlocked: {},
    blacksmithExperts: INITIAL_BLACKSMITH_EXPERTS.map((expert) => ({ ...expert })),
    activeCraftingSpecialists: {},
    activeCrafts: {},
    news: {
      activeEvents: [],
      newsHistory: [],
      seenBreakingEventIds: [],
      lastNewsGeneratedAt: null,
      totalNewsEventsSeen: 0,
    },
  };
}
