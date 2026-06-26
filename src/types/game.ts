export interface Resources {
  ore: number;
  wood: number;
  gems: number;
  coins: number;
  reputation: number;
}

export type ResourceKey = keyof Resources;

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface UnlockRequirement {
  coinsEarned?: number;
  reputation?: number;
  upgradeId?: string;
}

export interface CraftableItem {
  id: string;
  name: string;
  description: string;
  requiredResources: Partial<Resources>;
  coinValue: number;
  reputationGain: number;
  unlockRequirement: UnlockRequirement;
  emoji: string;
  rarity: Rarity;
}

export type UpgradeEffectType =
  | 'orePerClick'
  | 'woodPerClick'
  | 'sellMultiplier'
  | 'orePerSecond'
  | 'woodPerSecond'
  | 'autoSell'
  | 'unlockGems'
  | 'automationSpeed'
  | 'reputationMultiplier';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  effectType: UpgradeEffectType;
  effectPerLevel: number;
  maxLevel: number;
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

export interface GameState {
  resources: Resources;
  inventory: Record<string, number>;
  upgradeLevels: Record<string, number>;
  stats: GameStats;
  achievementsUnlocked: Record<string, boolean>;
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
  orePerClick: number;
  woodPerClick: number;
  sellMultiplier: number;
  orePerSecond: number;
  woodPerSecond: number;
  autoSellRate: number;
  automationSpeed: number;
  reputationMultiplier: number;
  gemsUnlocked: boolean;
}

export const INITIAL_RESOURCES: Resources = {
  ore: 0,
  wood: 0,
  gems: 0,
  coins: 25,
  reputation: 0,
};

export const INITIAL_STATS: GameStats = {
  totalClicks: 0,
  totalItemsCrafted: 0,
  totalCoinsEarned: 0,
  totalUpgradesPurchased: 0,
  totalGemsPolished: 0,
};

export function createInitialState(): GameState {
  return {
    resources: { ...INITIAL_RESOURCES },
    inventory: {},
    upgradeLevels: {},
    stats: { ...INITIAL_STATS },
    achievementsUnlocked: {},
  };
}
