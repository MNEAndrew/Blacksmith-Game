import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { ACHIEVEMENTS } from '../data/achievements';
import { ITEMS_BY_ID } from '../data/items';
import { UPGRADES_BY_ID } from '../data/upgrades';
import type { FloatingTextItem, GameState, GemKey, MaterialKey, ToastMessage } from '../types/game';
import { GEM_LABELS, GEM_ORDER, MATERIAL_LABELS, createInitialState } from '../types/game';
import {
  canAffordResources,
  canManuallyAcquireMaterial,
  canPurchaseUpgrade,
  computeModifiers,
  deductResources,
  findBestItemToAutoSell,
  getReputationGain,
  getSellPrice,
  getTreasureHunterStats,
  getUpgradeCost,
  getUpgradeLevel,
  isItemUnlocked,
} from '../utils/gameLogic';
import { clearSave, loadGame, saveGame } from '../utils/saveGame';

let toastId = 0;
let floatId = 0;

export function useGame() {
  const [state, setState] = useState<GameState>(() => loadGame() ?? createInitialState());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);
  const autoSellAccumulator = useRef(0);

  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'success') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const addFloatingText = useCallback((text: string, x: number, y: number) => {
    const id = ++floatId;
    setFloatingTexts((prev) => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((f) => f.id !== id));
    }, 900);
  }, []);

  const checkAchievements = useCallback((next: GameState) => {
    let changed = false;
    const achievementsUnlocked = { ...next.achievementsUnlocked };

    for (const achievement of ACHIEVEMENTS) {
      if (!achievementsUnlocked[achievement.id] && achievement.check(next)) {
        achievementsUnlocked[achievement.id] = true;
        changed = true;
        setTimeout(() => {
          addToast(`${achievement.emoji} Achievement: ${achievement.name}!`, 'info');
        }, 100);
      }
    }

    return changed ? { ...next, achievementsUnlocked } : next;
  }, [addToast]);

  const gatherMaterial = useCallback((material: MaterialKey, event?: MouseEvent<HTMLButtonElement>) => {
    setState((prev) => {
      if (!canManuallyAcquireMaterial(prev, material)) return prev;

      const modifiers = computeModifiers(prev);
      const gained = modifiers.gatherPerClick[material];
      const next: GameState = {
        ...prev,
        resources: {
          ...prev.resources,
          [material]: prev.resources[material] + gained,
        },
        stats: { ...prev.stats, totalClicks: prev.stats.totalClicks + 1 },
      };

      if (event) {
        addFloatingText(`+${gained} ${MATERIAL_LABELS[material]}`, event.clientX, event.clientY);
      }

      return checkAchievements(next);
    });
  }, [addFloatingText, checkAchievements]);

  const craftItem = useCallback((itemId: string) => {
    const item = ITEMS_BY_ID[itemId];
    if (!item) return;

    setState((prev) => {
      if (!isItemUnlocked(item, prev)) return prev;
      if (!canAffordResources(prev.resources, item.requiredResources)) return prev;

      const inventory = { ...prev.inventory };
      inventory[itemId] = (inventory[itemId] ?? 0) + 1;

      const craftedCounts = {
        ...prev.craftedCounts,
        [itemId]: (prev.craftedCounts[itemId] ?? 0) + 1,
      };

      const next: GameState = {
        ...prev,
        resources: deductResources(prev.resources, item.requiredResources),
        inventory,
        craftedCounts,
        stats: {
          ...prev.stats,
          totalItemsCrafted: prev.stats.totalItemsCrafted + 1,
        },
      };

      addToast(`Forged ${item.name}!`, 'success');
      return checkAchievements(next);
    });
  }, [addToast, checkAchievements]);

  const sellItem = useCallback((itemId: string, quantity = 1) => {
    const item = ITEMS_BY_ID[itemId];
    if (!item) return;

    setState((prev) => {
      const count = prev.inventory[itemId] ?? 0;
      if (count <= 0) return prev;

      const sellCount = Math.min(quantity, count);
      const modifiers = computeModifiers(prev);
      const coinsGained = getSellPrice(item, modifiers) * sellCount;
      const repGained = getReputationGain(item, modifiers) * sellCount;

      const inventory = { ...prev.inventory };
      inventory[itemId] = count - sellCount;
      if (inventory[itemId] <= 0) delete inventory[itemId];

      const next: GameState = {
        ...prev,
        resources: {
          ...prev.resources,
          coins: prev.resources.coins + coinsGained,
          reputation: prev.resources.reputation + repGained,
        },
        inventory,
        stats: {
          ...prev.stats,
          totalCoinsEarned: prev.stats.totalCoinsEarned + coinsGained,
        },
      };

      addToast(`Sold ${sellCount}x ${item.name} for ${coinsGained} coins (+${repGained} rep)`, 'success');
      return checkAchievements(next);
    });
  }, [addToast, checkAchievements]);

  const sellAll = useCallback(() => {
    setState((prev) => {
      const modifiers = computeModifiers(prev);
      const entries = Object.entries(prev.inventory).filter(([, count]) => count > 0);
      if (entries.length === 0) return prev;

      let coinsGained = 0;
      let repGained = 0;
      let soldCount = 0;

      for (const [itemId, count] of entries) {
        const item = ITEMS_BY_ID[itemId];
        if (!item) continue;
        coinsGained += getSellPrice(item, modifiers) * count;
        repGained += getReputationGain(item, modifiers) * count;
        soldCount += count;
      }

      const next: GameState = {
        ...prev,
        resources: {
          ...prev.resources,
          coins: prev.resources.coins + coinsGained,
          reputation: prev.resources.reputation + repGained,
        },
        inventory: {},
        stats: {
          ...prev.stats,
          totalCoinsEarned: prev.stats.totalCoinsEarned + coinsGained,
        },
      };

      addToast(`Sold ${soldCount} items for ${coinsGained} coins!`, 'success');
      return checkAchievements(next);
    });
  }, [addToast, checkAchievements]);

  const buyUpgrade = useCallback((upgradeId: string) => {
    const upgrade = UPGRADES_BY_ID[upgradeId];
    if (!upgrade) return;

    setState((prev) => {
      if (!canPurchaseUpgrade(prev, upgradeId)) return prev;

      const level = getUpgradeLevel(prev, upgradeId);
      const cost = getUpgradeCost(upgradeId, level);
      const upgradeLevels = { ...prev.upgradeLevels, [upgradeId]: level + 1 };
      const treasureHunter = upgrade.effectType === 'treasureHunter'
        ? {
            unlocked: true,
            level: level + 1,
          }
        : prev.treasureHunter;

      const next: GameState = {
        ...prev,
        resources: { ...prev.resources, coins: prev.resources.coins - cost },
        upgradeLevels,
        treasureHunter,
        stats: {
          ...prev.stats,
          totalUpgradesPurchased: prev.stats.totalUpgradesPurchased + 1,
        },
      };

      const message =
        upgrade.effectType === 'minerSpecialist' && upgrade.materialKey
          ? `${upgrade.name} hired - ${MATERIAL_LABELS[upgrade.materialKey]} automation online!`
          : upgrade.effectType === 'treasureHunter'
            ? `${upgrade.name} level ${level + 1} ready for gem expeditions!`
          : `${upgrade.name} upgraded to level ${level + 1}!`;

      addToast(message, 'info');
      return checkAchievements(next);
    });
  }, [addToast, checkAchievements]);

  const sendTreasureHunter = useCallback(() => {
    setState((prev) => {
      if (!prev.treasureHunter.unlocked || prev.treasureHunter.level <= 0) {
        addToast('Unlock the Treasure Hunter first.', 'warning');
        return prev;
      }

      const stats = getTreasureHunterStats(prev);
      if (stats.availableAttempts <= 0) {
        addToast('Need at least 10 Gold for a gem expedition.', 'warning');
        return prev;
      }

      const found: Partial<Record<GemKey, number>> = {};
      let misses = 0;

      for (let attempt = 0; attempt < stats.availableAttempts; attempt += 1) {
        const roll = Math.random() * 100;
        let result: GemKey | null = null;

        for (const gem of [...GEM_ORDER].reverse()) {
          if (roll < stats.odds[gem]) {
            result = gem;
            break;
          }
        }

        if (result) {
          found[result] = (found[result] ?? 0) + 1;
        } else {
          misses += 1;
        }
      }

      const gemInventory = { ...prev.gemInventory };
      for (const [gem, amount] of Object.entries(found) as Array<[GemKey, number]>) {
        gemInventory[gem] += amount;
      }

      const summary = Object.entries(found)
        .map(([gem, amount]) => `${amount} ${GEM_LABELS[gem as GemKey]}`)
        .join(', ');

      addToast(
        summary
          ? `Treasure Hunter found ${summary}${misses > 0 ? ` (${misses} empty searches)` : ''}.`
          : 'Treasure Hunter found no gems this time.',
        summary ? 'success' : 'warning',
      );

      return {
        ...prev,
        resources: {
          ...prev.resources,
          gold: prev.resources.gold - stats.expeditionCost,
        },
        gemInventory,
      };
    });
  }, [addToast]);

  const resetGame = useCallback(() => {
    clearSave();
    setState(createInitialState());
    addToast('Save reset - forge anew!', 'warning');
  }, [addToast]);

  useEffect(() => {
    const timer = setInterval(() => saveGame(state), 5000);
    return () => clearInterval(timer);
  }, [state]);

  useEffect(() => {
    saveGame(state);
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const modifiers = computeModifiers(prev);
        let next = prev;
        let changed = false;

        for (const [material, perSecond] of Object.entries(modifiers.materialPerSecond) as Array<[MaterialKey, number]>) {
          if (perSecond > 0) {
            next = {
              ...next,
              resources: {
                ...next.resources,
                [material]: next.resources[material] + perSecond / 10,
              },
            };
            changed = true;
          }
        }

        if (modifiers.autoSellRate > 0) {
          autoSellAccumulator.current += modifiers.autoSellRate / 10;
          if (autoSellAccumulator.current >= 1) {
            const itemId = findBestItemToAutoSell(next, modifiers);
            if (itemId) {
              const item = ITEMS_BY_ID[itemId];
              const count = next.inventory[itemId] ?? 0;
              if (item && count > 0) {
                const coinsGained = getSellPrice(item, modifiers);
                const repGained = getReputationGain(item, modifiers);
                const inventory = { ...next.inventory };
                inventory[itemId] = count - 1;
                if (inventory[itemId] <= 0) delete inventory[itemId];

                next = {
                  ...next,
                  resources: {
                    ...next.resources,
                    coins: next.resources.coins + coinsGained,
                    reputation: next.resources.reputation + repGained,
                  },
                  inventory,
                  stats: {
                    ...next.stats,
                    totalCoinsEarned: next.stats.totalCoinsEarned + coinsGained,
                  },
                };
                autoSellAccumulator.current -= 1;
                changed = true;
              }
            }
          }
        }

        return changed ? checkAchievements(next) : prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [checkAchievements]);

  const modifiers = computeModifiers(state);

  return {
    state,
    modifiers,
    toasts,
    floatingTexts,
    gatherMaterial,
    craftItem,
    sellItem,
    sellAll,
    buyUpgrade,
    sendTreasureHunter,
    resetGame,
    addToast,
  };
}
