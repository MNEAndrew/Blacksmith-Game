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
  source: 'manual' | 'expert';
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
  activeCrafts: Record<string, CraftProgress>;
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
  automationSpeed: number;
  reputationMultiplier: number;
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

export const INITIAL_STATS: GameStats = {
  totalClicks: 0,
  totalItemsCrafted: 0,
  totalCoinsEarned: 0,
  totalUpgradesPurchased: 0,
  totalGemsPolished: 0,
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
    stats: { ...INITIAL_STATS },
    achievementsUnlocked: {},
    blacksmithExperts: INITIAL_BLACKSMITH_EXPERTS.map((expert) => ({ ...expert })),
    activeCrafts: {},
  };
}
