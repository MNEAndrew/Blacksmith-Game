import { ITEMS_BY_ID } from '../data/items';
import { UPGRADES_BY_ID } from '../data/upgrades';
import type { BlacksmithExpert, CraftProgress, GameState, ResourceKey } from '../types/game';
import {
  GEM_ORDER,
  INITIAL_BLACKSMITH_EXPERTS,
  INITIAL_GEM_INVENTORY,
  INITIAL_MATERIAL_UNLOCKS,
  INITIAL_RESOURCES,
  MATERIAL_ORDER,
  createInitialState,
} from '../types/game';

const SAVE_KEY = 'forge-rush-save-v1';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

function safeInteger(value: unknown): number {
  return Math.floor(safeNumber(value));
}

function normalizeExperts(value: unknown): BlacksmithExpert[] {
  const savedExperts = Object.fromEntries(
    Object.entries(asRecord(value))
      .filter(([, expert]) => typeof expert === 'object' && expert !== null)
      .map(([id, expert]) => [id, asRecord(expert)]),
  );

  const arrayValue = Array.isArray(value) ? value.map(asRecord) : [];

  return INITIAL_BLACKSMITH_EXPERTS.map((baseExpert) => {
    const saved =
      arrayValue.find((expert) => expert.id === baseExpert.id) ??
      savedExperts[baseExpert.id] ??
      {};

    const assignedCraftableId =
      typeof saved.assignedCraftableId === 'string' && ITEMS_BY_ID[saved.assignedCraftableId]
        ? saved.assignedCraftableId
        : null;

    return {
      ...baseExpert,
      unlocked: typeof saved.unlocked === 'boolean' ? saved.unlocked : baseExpert.unlocked,
      assignedCraftableId,
      craftSpeedMultiplier: safeNumber(saved.craftSpeedMultiplier) || baseExpert.craftSpeedMultiplier,
      autoCraftEnabled: typeof saved.autoCraftEnabled === 'boolean'
        ? saved.autoCraftEnabled
        : baseExpert.autoCraftEnabled,
    };
  });
}

function normalizeActiveCrafts(value: unknown): Record<string, CraftProgress> {
  const entries: Array<[string, CraftProgress]> = [];

  for (const [key, rawCraft] of Object.entries(asRecord(value))) {
    const craft = asRecord(rawCraft);
    const itemId = typeof craft.itemId === 'string' && ITEMS_BY_ID[craft.itemId]
      ? craft.itemId
      : null;
    const source = craft.source === 'expert' ? 'expert' : 'manual';
    const requiredMs = safeInteger(craft.requiredMs);

    if (!itemId || requiredMs <= 0) continue;

    entries.push([
      key,
      {
        itemId,
        elapsedMs: Math.min(safeInteger(craft.elapsedMs), requiredMs),
        requiredMs,
        source,
        expertId: typeof craft.expertId === 'string' ? craft.expertId : undefined,
      },
    ]);
  }

  return Object.fromEntries(entries);
}

function normalizeGameState(value: unknown): GameState {
  const base = createInitialState();
  const raw = asRecord(value);
  const resources = asRecord(raw.resources);
  const materialUnlocks = asRecord(raw.materialUnlocks);
  const gemInventory = asRecord(raw.gemInventory);
  const treasureHunter = asRecord(raw.treasureHunter);
  const stats = asRecord(raw.stats);
  const inventory = asRecord(raw.inventory);
  const craftedCounts = asRecord(raw.craftedCounts);
  const upgradeLevels = asRecord(raw.upgradeLevels);
  const achievementsUnlocked = asRecord(raw.achievementsUnlocked);
  const normalizedResources = { ...INITIAL_RESOURCES };
  const normalizedCraftedCounts = Object.fromEntries(
    Object.entries(craftedCounts)
      .filter(([itemId, count]) => ITEMS_BY_ID[itemId] && safeInteger(count) > 0)
      .map(([itemId, count]) => [itemId, safeInteger(count)]),
  );
  const normalizedMaterialUnlocks = { ...INITIAL_MATERIAL_UNLOCKS };

  for (const key of Object.keys(INITIAL_RESOURCES) as ResourceKey[]) {
    normalizedResources[key] = typeof resources[key] === 'number' && Number.isFinite(resources[key])
      ? Math.max(0, resources[key])
      : base.resources[key];
  }

  if (typeof resources.ore === 'number' && Number.isFinite(resources.ore)) {
    normalizedResources.stone += Math.max(0, resources.ore);
  }

  if (typeof resources.gems === 'number' && Number.isFinite(resources.gems)) {
    normalizedResources.emerald += Math.max(0, resources.gems);
  }

  for (const material of MATERIAL_ORDER) {
    if (typeof materialUnlocks[material] === 'boolean') {
      normalizedMaterialUnlocks[material] = materialUnlocks[material];
    }
  }

  for (let index = 1; index < MATERIAL_ORDER.length; index += 1) {
    const material = MATERIAL_ORDER[index];
    const previousMaterial = MATERIAL_ORDER[index - 1];
    if ((normalizedCraftedCounts[`${previousMaterial}-pickaxe`] ?? 0) >= 100) {
      normalizedMaterialUnlocks[material] = true;
    }
  }

  return {
    resources: normalizedResources,
    materialUnlocks: normalizedMaterialUnlocks,
    gemInventory: {
      ...INITIAL_GEM_INVENTORY,
      ...Object.fromEntries(
        GEM_ORDER.map((gem) => [gem, safeInteger(gemInventory[gem])]),
      ),
    },
    treasureHunter: {
      unlocked: typeof treasureHunter.unlocked === 'boolean'
        ? treasureHunter.unlocked
        : (safeInteger(upgradeLevels['treasure-hunter']) > 0),
      level: Math.min(10, Math.max(0, safeInteger(treasureHunter.level) || safeInteger(upgradeLevels['treasure-hunter']))),
    },
    inventory: Object.fromEntries(
      Object.entries(inventory)
        .filter(([itemId, count]) => ITEMS_BY_ID[itemId] && safeInteger(count) > 0)
        .map(([itemId, count]) => [itemId, safeInteger(count)]),
    ),
    craftedCounts: normalizedCraftedCounts,
    upgradeLevels: Object.fromEntries(
      Object.entries(upgradeLevels)
        .filter(([upgradeId, level]) => UPGRADES_BY_ID[upgradeId] && safeInteger(level) > 0)
        .map(([upgradeId, level]) => {
          const upgrade = UPGRADES_BY_ID[upgradeId];
          return [upgradeId, Math.min(safeInteger(level), upgrade.maxLevel)];
        }),
    ),
    stats: {
      totalClicks: safeInteger(stats.totalClicks),
      totalItemsCrafted: safeInteger(stats.totalItemsCrafted),
      totalCoinsEarned: safeNumber(stats.totalCoinsEarned),
      totalUpgradesPurchased: safeInteger(stats.totalUpgradesPurchased),
      totalGemsPolished: safeInteger(stats.totalGemsPolished),
    },
    achievementsUnlocked: Object.fromEntries(
      Object.entries(achievementsUnlocked)
        .filter(([, unlocked]) => unlocked === true),
    ) as Record<string, boolean>,
    blacksmithExperts: normalizeExperts(raw.blacksmithExperts),
    activeCrafts: normalizeActiveCrafts(raw.activeCrafts),
  };
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(normalizeGameState(state)));
  } catch {
    // Storage can be unavailable in private windows or blocked browser contexts.
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return normalizeGameState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore storage failures so reset never breaks the game UI.
  }
}
