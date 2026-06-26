import type {
  BlacksmithExpert,
  CraftProgress,
  CraftableItem,
  GameModifiers,
  GameState,
  GemKey,
  MaterialKey,
  ResourceKey,
  Resources,
  UnlockRequirement,
} from '../types/game';
import {
  GEM_ORDER,
  MATERIAL_LABELS,
  MATERIAL_ORDER,
  SPECIALIST_MATERIALS,
} from '../types/game';
import { UPGRADES_BY_ID } from '../data/upgrades';
import { CRAFTABLE_ITEMS, PICKAXE_ITEM_BY_MATERIAL } from '../data/items';

export interface ProgressInfo {
  current: number;
  required: number;
  ratio: number;
  label: string;
}

export interface TreasureHunterStats {
  level: number;
  maxSlots: number;
  availableAttempts: number;
  costPerAttempt: number;
  expeditionCost: number;
  odds: Record<GemKey, number>;
}

const TREASURE_HUNTER_MAX_LEVEL = 10;
const TREASURE_HUNTER_COST_PER_ATTEMPT = 10;
const TREASURE_HUNTER_BASE_ODDS: Record<GemKey, number> = {
  crude: 80,
  mediocre: 60,
  polished: 40,
  precious: 20,
};
const TREASURE_HUNTER_MAX_ODDS: Record<GemKey, number> = {
  crude: 95,
  mediocre: 80,
  polished: 65,
  precious: 50,
};

function lerp(start: number, end: number, ratio: number): number {
  return start + (end - start) * ratio;
}

function createMaterialRecord(value = 0): Record<MaterialKey, number> {
  return Object.fromEntries(MATERIAL_ORDER.map((material) => [material, value])) as Record<MaterialKey, number>;
}

export function getPickaxeItemId(material: MaterialKey): string {
  return `${material}-pickaxe`;
}

export function getCraftedPickaxeCount(state: GameState, material: MaterialKey): number {
  return state.craftedCounts[getPickaxeItemId(material)] ?? 0;
}

export function getPickaxeInventoryCount(state: GameState, material: MaterialKey): number {
  return state.inventory[getPickaxeItemId(material)] ?? 0;
}

export function getUpgradeCost(upgradeId: string, currentLevel: number): number {
  const upgrade = UPGRADES_BY_ID[upgradeId];
  if (!upgrade) return Infinity;
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}

export function getUpgradeLevel(state: GameState, upgradeId: string): number {
  return state.upgradeLevels[upgradeId] ?? 0;
}

export function getTreasureHunterStats(state: GameState): TreasureHunterStats {
  const level = Math.max(0, state.treasureHunter.level);
  const progress = level <= 1 ? 0 : Math.min(1, (level - 1) / (TREASURE_HUNTER_MAX_LEVEL - 1));
  const maxSlots = level > 0 ? Math.min(100, level * 10) : 0;
  const availableAttempts = Math.min(maxSlots, Math.floor(state.resources.gold / TREASURE_HUNTER_COST_PER_ATTEMPT));

  return {
    level,
    maxSlots,
    availableAttempts,
    costPerAttempt: TREASURE_HUNTER_COST_PER_ATTEMPT,
    expeditionCost: availableAttempts * TREASURE_HUNTER_COST_PER_ATTEMPT,
    odds: Object.fromEntries(
      GEM_ORDER.map((gem) => [
        gem,
        Math.round(lerp(TREASURE_HUNTER_BASE_ODDS[gem], TREASURE_HUNTER_MAX_ODDS[gem], progress)),
      ]),
    ) as Record<GemKey, number>,
  };
}

export function hasPickaxeCraftRequirement(
  state: GameState,
  material: MaterialKey,
  count = 100,
): boolean {
  return getCraftedPickaxeCount(state, material) >= count;
}

export function isSpecialistMaterial(material: MaterialKey): boolean {
  return SPECIALIST_MATERIALS.includes(material);
}

export function hasMinerSpecialist(state: GameState, material: MaterialKey): boolean {
  return getUpgradeLevel(state, `${material}-miner-specialist`) > 0;
}

export function isMaterialUnlocked(state: GameState, material: MaterialKey): boolean {
  return material === 'wood' || (state.materialUnlocks[material] ?? false);
}

export function canManuallyAcquireMaterial(state: GameState, material: MaterialKey): boolean {
  return !isSpecialistMaterial(material) && isMaterialUnlocked(state, material);
}

export function getPreviousMaterial(material: MaterialKey): MaterialKey | null {
  const materialIndex = MATERIAL_ORDER.indexOf(material);
  return materialIndex > 0 ? MATERIAL_ORDER[materialIndex - 1] : null;
}

export function getMaterialUnlockProgress(state: GameState, material: MaterialKey): ProgressInfo | null {
  const previousMaterial = getPreviousMaterial(material);
  if (!previousMaterial) return null;

  const current = getPickaxeInventoryCount(state, previousMaterial);
  return {
    current,
    required: 100,
    ratio: Math.min(1, current / 100),
    label: `${MATERIAL_LABELS[previousMaterial]} Pickaxes required`,
  };
}

export function canUnlockMaterial(state: GameState, material: MaterialKey): boolean {
  if (isMaterialUnlocked(state, material)) return false;

  const previousMaterial = getPreviousMaterial(material);
  if (!previousMaterial) return false;
  if (getPickaxeInventoryCount(state, previousMaterial) < 100) return false;

  if (isSpecialistMaterial(material) && !hasMinerSpecialist(state, material)) {
    return false;
  }

  return true;
}

export function computeModifiers(state: GameState): GameModifiers {
  const levels = state.upgradeLevels;
  const gatherPerClick = createMaterialRecord(1);
  const materialPerSecond = createMaterialRecord(0);

  const toolLevel = levels['stronger-tools'] ?? 0;
  const bellows = levels['master-bellows'] ?? 0;
  const furnace = levels['hotter-furnace'] ?? 0;
  const banner = levels['guild-banner'] ?? 0;
  const automationSpeed = 1 + bellows * 0.18;

  for (const material of MATERIAL_ORDER) {
    gatherPerClick[material] = 1 + toolLevel;
  }

  for (const upgrade of Object.values(UPGRADES_BY_ID)) {
    const level = levels[upgrade.id] ?? 0;
    if (level <= 0 || !upgrade.materialKey) continue;

    if (upgrade.effectType === 'materialPerSecond') {
      materialPerSecond[upgrade.materialKey] += level * upgrade.effectPerLevel * automationSpeed;
    }

    if (upgrade.effectType === 'minerSpecialist') {
      materialPerSecond[upgrade.materialKey] += upgrade.effectPerLevel * automationSpeed;
    }
  }

  return {
    gatherPerClick,
    materialPerSecond,
    sellMultiplier: 1 + furnace * 0.12,
    automationSpeed,
    reputationMultiplier: 1 + banner * 0.15,
  };
}

export function isItemUnlocked(item: CraftableItem, state: GameState): boolean {
  if (item.pickaxeMaterial) {
    return isMaterialUnlocked(state, item.pickaxeMaterial);
  }

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
  if (
    req.pickaxeCraft !== undefined &&
    !hasPickaxeCraftRequirement(state, req.pickaxeCraft.material, req.pickaxeCraft.count)
  ) {
    return false;
  }
  if (req.materialUnlocked !== undefined && !isMaterialUnlocked(state, req.materialUnlocked)) {
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

export function getResourceReadiness(
  resources: Resources,
  required: Partial<Resources>,
): number {
  const ratios = Object.entries(required)
    .filter(([, amount]) => (amount ?? 0) > 0)
    .map(([key, amount]) => {
      const resourceKey = key as keyof Resources;
      return (resources[resourceKey] ?? 0) / (amount ?? 1);
    });

  if (ratios.length === 0) return 1;
  return Math.min(1, Math.max(0, Math.min(...ratios)));
}

function getGemReadiness(state: GameState, item: CraftableItem): number {
  const ratios = Object.entries(item.requiredGems ?? {})
    .filter(([, amount]) => (amount ?? 0) > 0)
    .map(([gem, amount]) => (state.gemInventory[gem as GemKey] ?? 0) / (amount ?? 1));

  if (ratios.length === 0) return 1;
  return Math.min(1, Math.max(0, Math.min(...ratios)));
}

export function canAffordCraftable(state: GameState, item: CraftableItem): boolean {
  if (!canAffordResources(state.resources, item.requiredResources)) return false;

  for (const [gem, amount] of Object.entries(item.requiredGems ?? {}) as Array<[GemKey, number]>) {
    if ((state.gemInventory[gem] ?? 0) < amount) {
      return false;
    }
  }

  return true;
}

export function deductGems(
  gems: GameState['gemInventory'],
  required: CraftableItem['requiredGems'],
): GameState['gemInventory'] {
  const next = { ...gems };
  for (const [gem, amount] of Object.entries(required ?? {}) as Array<[GemKey, number]>) {
    next[gem] = Math.max(0, next[gem] - amount);
  }
  return next;
}

export function getCraftProgressRatio(progress?: CraftProgress): number {
  if (!progress || progress.requiredMs <= 0) return 0;
  return Math.min(1, Math.max(0, progress.elapsedMs / progress.requiredMs));
}

export function getCraftingSpecialistCraftKey(itemId: string): string {
  return `specialist:${itemId}`;
}

export function getCraftingSpecialistCostPerMinute(
  item: CraftableItem,
  modifiers: GameModifiers,
): number {
  return Math.max(1, Math.ceil(getSellPrice(item, modifiers) * 0.1));
}

export function getAssignedExpertForItem(
  state: GameState,
  itemId: string,
): BlacksmithExpert | null {
  return state.blacksmithExperts.find((expert) =>
    expert.unlocked &&
    expert.autoCraftEnabled &&
    expert.assignedCraftableId === itemId
  ) ?? null;
}

export function getCraftableProgressInfo(
  item: CraftableItem,
  state: GameState,
): ProgressInfo {
  const manualCraft = state.activeCrafts[item.id];
  if (manualCraft) {
    return {
      current: manualCraft.elapsedMs,
      required: manualCraft.requiredMs,
      ratio: getCraftProgressRatio(manualCraft),
      label: 'Crafting',
    };
  }

  if (state.activeCraftingSpecialists[item.id]) {
    const specialistCraft = state.activeCrafts[getCraftingSpecialistCraftKey(item.id)];
    if (specialistCraft) {
      return {
        current: specialistCraft.elapsedMs,
        required: specialistCraft.requiredMs,
        ratio: getCraftProgressRatio(specialistCraft),
        label: 'Specialist crafting',
      };
    }
  }

  const expert = getAssignedExpertForItem(state, item.id);
  const expertCraft = expert ? state.activeCrafts[expert.id] : undefined;
  if (expert && expertCraft) {
    return {
      current: expertCraft.elapsedMs,
      required: expertCraft.requiredMs,
      ratio: getCraftProgressRatio(expertCraft),
      label: `${expert.name} auto-craft`,
    };
  }

  const readiness = Math.min(
    getResourceReadiness(state.resources, item.requiredResources),
    getGemReadiness(state, item),
  );
  return {
    current: readiness,
    required: 1,
    ratio: readiness,
    label: 'Materials ready',
  };
}

function getCheapestCraftTargetForResource(
  state: GameState,
  resourceKey: ResourceKey,
): ProgressInfo | null {
  const candidates = CRAFTABLE_ITEMS
    .filter((item) => isItemUnlocked(item, state))
    .filter((item) => (item.requiredResources[resourceKey] ?? 0) > 0)
    .sort((a, b) => {
      const aCost = Object.values(a.requiredResources).reduce((sum, amount) => sum + (amount ?? 0), 0);
      const bCost = Object.values(b.requiredResources).reduce((sum, amount) => sum + (amount ?? 0), 0);
      return aCost - bCost;
    });

  const target = candidates[0];
  const required = target?.requiredResources[resourceKey] ?? 0;
  if (!target || required <= 0) return null;

  const current = state.resources[resourceKey];
  return {
    current,
    required,
    ratio: Math.min(1, current / required),
    label: `Next: ${target.name}`,
  };
}

function getNextCoinTarget(state: GameState): ProgressInfo | null {
  const targets = Object.values(UPGRADES_BY_ID)
    .filter((upgrade) => upgrade.unlockRequirement == null || meetsUnlockRequirement(upgrade.unlockRequirement, state))
    .map((upgrade) => {
      const level = getUpgradeLevel(state, upgrade.id);
      return {
        upgrade,
        cost: level >= upgrade.maxLevel ? Infinity : getUpgradeCost(upgrade.id, level),
      };
    })
    .filter(({ cost }) => Number.isFinite(cost))
    .sort((a, b) => a.cost - b.cost);

  const target = targets[0];
  if (!target) return null;

  return {
    current: state.resources.coins,
    required: target.cost,
    ratio: Math.min(1, state.resources.coins / target.cost),
    label: `Next: ${target.upgrade.name}`,
  };
}

function getNextReputationTarget(state: GameState): ProgressInfo | null {
  const targets = CRAFTABLE_ITEMS
    .map((item) => ({
      item,
      required: item.unlockRequirement.reputation,
    }))
    .filter((target): target is { item: CraftableItem; required: number } =>
      target.required !== undefined && target.required > state.resources.reputation,
    )
    .sort((a, b) => a.required - b.required);

  const target = targets[0];
  if (!target) return null;

  return {
    current: state.resources.reputation,
    required: target.required,
    ratio: Math.min(1, state.resources.reputation / target.required),
    label: `Next: ${target.item.name}`,
  };
}

function getNextPickaxeUnlockTarget(state: GameState, material: MaterialKey): ProgressInfo | null {
  const materialIndex = MATERIAL_ORDER.indexOf(material);
  const nextMaterial = MATERIAL_ORDER[materialIndex + 1];
  if (!nextMaterial) return null;
  if (isMaterialUnlocked(state, nextMaterial)) return null;

  const current = getPickaxeInventoryCount(state, material);

  return {
    current,
    required: 100,
    ratio: Math.min(1, current / 100),
    label: `Unlock ${MATERIAL_LABELS[nextMaterial]}`,
  };
}

export function getResourceProgressTargets(state: GameState): Record<ResourceKey, ProgressInfo | null> {
  const materialTargets = Object.fromEntries(
    MATERIAL_ORDER.map((material) => {
      const craftTarget = getCheapestCraftTargetForResource(state, material);
      return [material, craftTarget ?? getNextPickaxeUnlockTarget(state, material)];
    }),
  ) as Record<MaterialKey, ProgressInfo | null>;

  return {
    ...materialTargets,
    coins: getNextCoinTarget(state),
    reputation: getNextReputationTarget(state),
  };
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
  return Object.values(modifiers.materialPerSecond).reduce((sum, value) => sum + value, 0);
}

export function canPurchaseUpgrade(state: GameState, upgradeId: string): boolean {
  const upgrade = UPGRADES_BY_ID[upgradeId];
  if (!upgrade) return false;
  if (upgrade.unlockRequirement && !meetsUnlockRequirement(upgrade.unlockRequirement, state)) return false;
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
  if (req.pickaxeCraft !== undefined) {
    parts.push(`${req.pickaxeCraft.count} ${MATERIAL_LABELS[req.pickaxeCraft.material]} Pickaxes crafted`);
  }
  if (req.coinsEarned !== undefined) parts.push(`${formatNumber(req.coinsEarned)} coins earned`);
  if (req.reputation !== undefined) parts.push(`${req.reputation} reputation`);
  if (req.upgradeId !== undefined) {
    const upgrade = UPGRADES_BY_ID[req.upgradeId];
    parts.push(upgrade ? upgrade.name : req.upgradeId);
  }
  if (req.materialUnlocked !== undefined) {
    parts.push(`${MATERIAL_LABELS[req.materialUnlocked]} unlocked`);
  }
  return parts.length > 0 ? parts.join(' / ') : 'Available from the start';
}

export function getPickaxeCraftProgress(state: GameState, material: MaterialKey): ProgressInfo {
  const pickaxe = PICKAXE_ITEM_BY_MATERIAL[material];
  return {
    current: getCraftedPickaxeCount(state, material),
    required: 100,
    ratio: Math.min(1, getCraftedPickaxeCount(state, material) / 100),
    label: pickaxe ? `${pickaxe.name} crafted` : `${MATERIAL_LABELS[material]} Pickaxes crafted`,
  };
}

export function getPickaxeInventoryProgress(state: GameState, material: MaterialKey): ProgressInfo {
  const pickaxe = PICKAXE_ITEM_BY_MATERIAL[material];
  return {
    current: getPickaxeInventoryCount(state, material),
    required: 100,
    ratio: Math.min(1, getPickaxeInventoryCount(state, material) / 100),
    label: pickaxe ? `${pickaxe.name} in stock` : `${MATERIAL_LABELS[material]} Pickaxes in stock`,
  };
}
