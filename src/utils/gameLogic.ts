import type { CraftableItem, GameModifiers, GameState, Resources, UnlockRequirement } from '../types/game';
import { UPGRADES_BY_ID } from '../data/upgrades';
import { ITEMS_BY_ID } from '../data/items';

export function getUpgradeCost(upgradeId: string, currentLevel: number): number {
  const upgrade = UPGRADES_BY_ID[upgradeId];
  if (!upgrade) return Infinity;
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}

export function getUpgradeLevel(state: GameState, upgradeId: string): number {
  return state.upgradeLevels[upgradeId] ?? 0;
}

export function computeModifiers(state: GameState): GameModifiers {
  const levels = state.upgradeLevels;

  const pickaxe = levels['stronger-pickaxe'] ?? 0;
  const axe = levels['better-axe'] ?? 0;
  const furnace = levels['hotter-furnace'] ?? 0;
  const apprentice = levels['apprentice-smith'] ?? 0;
  const lumber = levels['lumber-helper'] ?? 0;
  const cart = levels['trade-cart'] ?? 0;
  const gemBench = levels['gem-bench'] ?? 0;
  const bellows = levels['master-bellows'] ?? 0;
  const banner = levels['guild-banner'] ?? 0;

  const automationSpeed = 1 + bellows * 0.18;

  return {
    orePerClick: 1 + pickaxe,
    woodPerClick: 1 + axe,
    sellMultiplier: 1 + furnace * 0.12,
    orePerSecond: apprentice * 0.6 * automationSpeed,
    woodPerSecond: lumber * 0.6 * automationSpeed,
    autoSellRate: cart * automationSpeed,
    automationSpeed,
    reputationMultiplier: 1 + banner * 0.15,
    gemsUnlocked: gemBench > 0,
  };
}

export function isItemUnlocked(item: CraftableItem, state: GameState): boolean {
  return meetsUnlockRequirement(item.unlockRequirement, state);
}

export function meetsUnlockRequirement(req: UnlockRequirement, state: GameState): boolean {
  if (req.coinsEarned !== undefined && state.stats.totalCoinsEarned < req.coinsEarned) {
    return false;
  }
  if (req.reputation !== undefined && state.resources.reputation < req.reputation) {
    return false;
  }
  if (req.upgradeId !== undefined && getUpgradeLevel(state, req.upgradeId) < 1) {
    return false;
  }
  return true;
}

export function canAffordResources(
  resources: Resources,
  required: Partial<Resources>,
): boolean {
  for (const [key, amount] of Object.entries(required)) {
    const resourceKey = key as keyof Resources;
    if ((resources[resourceKey] ?? 0) < (amount ?? 0)) {
      return false;
    }
  }
  return true;
}

export function deductResources(
  resources: Resources,
  required: Partial<Resources>,
): Resources {
  const next = { ...resources };
  for (const [key, amount] of Object.entries(required)) {
    const resourceKey = key as keyof Resources;
    next[resourceKey] = Math.max(0, next[resourceKey] - (amount ?? 0));
  }
  return next;
}

export function getSellPrice(item: CraftableItem, modifiers: GameModifiers): number {
  return Math.floor(item.coinValue * modifiers.sellMultiplier);
}

export function getReputationGain(item: CraftableItem, modifiers: GameModifiers): number {
  return Math.max(1, Math.floor(item.reputationGain * modifiers.reputationMultiplier));
}

export function getInventoryCount(state: GameState): number {
  return Object.values(state.inventory).reduce(
    (sum, count) => sum + (Number.isFinite(count) && count > 0 ? count : 0),
    0,
  );
}

export function getTotalProductionPerSecond(modifiers: GameModifiers): number {
  return modifiers.orePerSecond + modifiers.woodPerSecond;
}

export function findBestItemToAutoSell(state: GameState, modifiers: GameModifiers): string | null {
  let bestId: string | null = null;
  let bestValue = -1;

  for (const [itemId, count] of Object.entries(state.inventory)) {
    if (count <= 0) continue;
    const item = ITEMS_BY_ID[itemId];
    if (!item) continue;
    const value = getSellPrice(item, modifiers);
    if (value > bestValue) {
      bestValue = value;
      bestId = itemId;
    }
  }

  return bestId;
}

export function canPurchaseUpgrade(state: GameState, upgradeId: string): boolean {
  const upgrade = UPGRADES_BY_ID[upgradeId];
  if (!upgrade) return false;
  const level = getUpgradeLevel(state, upgradeId);
  if (level >= upgrade.maxLevel) return false;
  const cost = getUpgradeCost(upgradeId, level);
  return state.resources.coins >= cost;
}

export function formatNumber(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (safeValue >= 1_000_000) return `${(safeValue / 1_000_000).toFixed(1)}M`;
  if (safeValue >= 10_000) return `${(safeValue / 1_000).toFixed(1)}K`;
  return Math.floor(safeValue).toLocaleString();
}

export function formatUnlockRequirement(req: UnlockRequirement): string {
  const parts: string[] = [];
  if (req.coinsEarned !== undefined) parts.push(`${formatNumber(req.coinsEarned)} coins earned`);
  if (req.reputation !== undefined) parts.push(`${req.reputation} reputation`);
  if (req.upgradeId !== undefined) {
    const upgrade = UPGRADES_BY_ID[req.upgradeId];
    parts.push(upgrade ? upgrade.name : req.upgradeId);
  }
  return parts.length > 0 ? parts.join(' · ') : 'Available from the start';
}
