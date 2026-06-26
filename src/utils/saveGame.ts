import { ITEMS_BY_ID } from '../data/items';
import { UPGRADES_BY_ID } from '../data/upgrades';
import type { GameState } from '../types/game';
import { createInitialState } from '../types/game';

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

function normalizeGameState(value: unknown): GameState {
  const base = createInitialState();
  const raw = asRecord(value);
  const resources = asRecord(raw.resources);
  const stats = asRecord(raw.stats);
  const inventory = asRecord(raw.inventory);
  const upgradeLevels = asRecord(raw.upgradeLevels);
  const achievementsUnlocked = asRecord(raw.achievementsUnlocked);

  return {
    resources: {
      ore: safeNumber(resources.ore),
      wood: safeNumber(resources.wood),
      gems: safeNumber(resources.gems),
      coins: typeof resources.coins === 'number' && Number.isFinite(resources.coins)
        ? Math.max(0, resources.coins)
        : base.resources.coins,
      reputation: safeNumber(resources.reputation),
    },
    inventory: Object.fromEntries(
      Object.entries(inventory)
        .filter(([itemId, count]) => ITEMS_BY_ID[itemId] && safeInteger(count) > 0)
        .map(([itemId, count]) => [itemId, safeInteger(count)]),
    ),
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
