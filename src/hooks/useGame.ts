import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { ACHIEVEMENTS } from '../data/achievements';
import { ITEMS_BY_ID } from '../data/items';
import {
  INITIAL_NEWS_EVENT_DELAY_MS,
  MAX_ACTIVE_NEWS_EVENTS,
  NEWS_EVENT_INTERVAL_MS,
  NEWS_EVENT_TICK_MS,
  NEWS_HISTORY_LIMIT,
} from '../data/newsEvents';
import { UPGRADES_BY_ID } from '../data/upgrades';
import type { FloatingTextItem, GameState, GemKey, MaterialKey, ToastMessage } from '../types/game';
import { GEM_LABELS, GEM_ORDER, MATERIAL_LABELS, createEmptyMaterialTotals, createInitialState } from '../types/game';
import { getActiveEventModifiers, getEventImpactScore } from '../utils/eventModifiers';
import {
  canAffordCraftable,
  canManuallyAcquireMaterial,
  canPurchaseUpgrade,
  canUnlockMaterial,
  computeModifiers,
  getCraftSpeedMultiplierForItem,
  getCraftingSpecialistCostPerMinute,
  getCraftingSpecialistCraftKey,
  getPreviousMaterial,
  getReputationGain,
  getSellPrice,
  getTreasureHunterStats,
  getUpgradeCost,
  getUpgradeLevel,
  isItemUnlocked,
  recordCraftedItem,
} from '../utils/gameLogic';
import { generateNewsEvent } from '../utils/newsGenerator';
import { clearSave, loadGame, saveGame } from '../utils/saveGame';

let toastId = 0;
let floatId = 0;
const GAME_TICK_MS = 100;

export function useGame() {
  const [state, setState] = useState<GameState>(() => loadGame() ?? createInitialState());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextItem[]>([]);

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
        stats: {
          ...prev.stats,
          totalClicks: prev.stats.totalClicks + 1,
          resourcesGainedManual: {
            ...createEmptyMaterialTotals(),
            ...prev.stats.resourcesGainedManual,
            [material]: (prev.stats.resourcesGainedManual[material] ?? 0) + gained,
          },
        },
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
      const next = recordCraftedItem(prev, item, 'manual');
      if (!next) return prev;

      addToast(`Forged ${item.name}!`, 'success');
      return checkAchievements(next);
    });
  }, [addToast, checkAchievements]);

  const unlockMaterial = useCallback((material: MaterialKey) => {
    setState((prev) => {
      if (!canUnlockMaterial(prev, material)) return prev;

      const previousMaterial = getPreviousMaterial(material);
      if (!previousMaterial) return prev;

      const previousPickaxeId = `${previousMaterial}-pickaxe`;
      const inventory = { ...prev.inventory };
      inventory[previousPickaxeId] = (inventory[previousPickaxeId] ?? 0) - 100;
      if (inventory[previousPickaxeId] <= 0) delete inventory[previousPickaxeId];

      const next: GameState = {
        ...prev,
        inventory,
        materialUnlocks: {
          ...prev.materialUnlocks,
          [material]: true,
        },
      };

      addToast(`${MATERIAL_LABELS[material]} tier unlocked!`, 'info');
      return checkAchievements(next);
    });
  }, [addToast, checkAchievements]);

  const toggleCraftingSpecialist = useCallback((itemId: string) => {
    const item = ITEMS_BY_ID[itemId];
    if (!item) return;

    setState((prev) => {
      if (!isItemUnlocked(item, prev)) return prev;

      const active = !!prev.activeCraftingSpecialists[itemId];
      const activeCraftingSpecialists = { ...prev.activeCraftingSpecialists };
      const activeCrafts = { ...prev.activeCrafts };

      if (active) {
        delete activeCraftingSpecialists[itemId];
        delete activeCrafts[getCraftingSpecialistCraftKey(itemId)];
        addToast(`${item.name} specialist fired.`, 'warning');
      } else {
        activeCraftingSpecialists[itemId] = true;
        addToast(`${item.name} specialist hired.`, 'info');
      }

      return {
        ...prev,
        activeCraftingSpecialists,
        activeCrafts,
      };
    });
  }, [addToast]);

  const sellItem = useCallback((itemId: string, quantity = 1) => {
    const item = ITEMS_BY_ID[itemId];
    if (!item) return;

    setState((prev) => {
      const count = prev.inventory[itemId] ?? 0;
      if (count <= 0) return prev;

      const sellCount = Math.min(quantity, count);
      const modifiers = computeModifiers(prev);
      const baseModifiers = computeModifiers(prev, { includeNews: false });
      const coinsGained = getSellPrice(item, modifiers) * sellCount;
      const repGained = getReputationGain(item, modifiers) * sellCount;
      const baseCoinsGained = getSellPrice(item, baseModifiers) * sellCount;
      const baseRepGained = getReputationGain(item, baseModifiers) * sellCount;

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
          totalItemsSold: prev.stats.totalItemsSold + sellCount,
          totalCoinsFromSelling: prev.stats.totalCoinsFromSelling + coinsGained,
          coinsGainedFromEventBonuses: prev.stats.coinsGainedFromEventBonuses + Math.max(0, coinsGained - baseCoinsGained),
          reputationGainedFromEventBonuses: prev.stats.reputationGainedFromEventBonuses + Math.max(0, repGained - baseRepGained),
        },
      };

      addToast(`Sold ${sellCount}x ${item.name} for ${coinsGained} coins (+${repGained} rep)`, 'success');
      return checkAchievements(next);
    });
  }, [addToast, checkAchievements]);

  const buyUpgrade = useCallback((upgradeId: string) => {
    const upgrade = UPGRADES_BY_ID[upgradeId];
    if (!upgrade) return;

    setState((prev) => {
      if (!canPurchaseUpgrade(prev, upgradeId)) return prev;

      const level = getUpgradeLevel(prev, upgradeId);
      const cost = getUpgradeCost(upgradeId, level, computeModifiers(prev));
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
          coinsSpentOnUpgrades: prev.stats.coinsSpentOnUpgrades + cost,
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
      let gemsFound = 0;
      for (const [gem, amount] of Object.entries(found) as Array<[GemKey, number]>) {
        gemInventory[gem] += amount;
        gemsFound += amount;
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
        stats: {
          ...prev.stats,
          totalGemsPolished: prev.stats.totalGemsPolished + gemsFound,
        },
      };
    });
  }, [addToast]);

  const recordLeaderboardSync = useCallback((syncedAt = new Date().toISOString()) => {
    setState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        bestSyncedReputation: Math.max(prev.stats.bestSyncedReputation, prev.resources.reputation),
        lastSyncedAt: syncedAt,
      },
    }));
  }, []);

  const markBreakingNewsSeen = useCallback((eventId: string) => {
    setState((prev) => {
      if (prev.news.seenBreakingEventIds.includes(eventId)) return prev;

      return {
        ...prev,
        news: {
          ...prev.news,
          seenBreakingEventIds: [...prev.news.seenBreakingEventIds, eventId],
          activeEvents: prev.news.activeEvents.map((event) =>
            event.id === eventId ? { ...event, hasBeenSeen: true } : event,
          ),
        },
      };
    });
  }, []);

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
        const automationGains = createEmptyMaterialTotals();
        let totalProductionPerSecond = 0;

        for (const [material, perSecond] of Object.entries(modifiers.materialPerSecond) as Array<[MaterialKey, number]>) {
          if (perSecond > 0) {
            const gained = perSecond / 10;
            next = {
              ...next,
              resources: {
                ...next.resources,
                [material]: next.resources[material] + gained,
              },
            };
            automationGains[material] += gained;
            totalProductionPerSecond += perSecond;
            changed = true;
          }
        }

        if (totalProductionPerSecond > 0) {
          const resourcesGainedAuto = {
            ...createEmptyMaterialTotals(),
            ...next.stats.resourcesGainedAuto,
          };
          for (const material of Object.keys(automationGains) as MaterialKey[]) {
            resourcesGainedAuto[material] += automationGains[material];
          }

          next = {
            ...next,
            stats: {
              ...next.stats,
              resourcesGainedAuto,
              bestProductionPerSecond: Math.max(next.stats.bestProductionPerSecond, totalProductionPerSecond),
            },
          };
        }

        const activeSpecialistItems = Object.keys(next.activeCraftingSpecialists)
          .filter((itemId) => next.activeCraftingSpecialists[itemId])
          .map((itemId) => ITEMS_BY_ID[itemId])
          .filter((item) => item && isItemUnlocked(item, next));

        if (activeSpecialistItems.length > 0) {
          const totalPayrollPerMinute = activeSpecialistItems.reduce(
            (sum, item) => sum + getCraftingSpecialistCostPerMinute(item, modifiers),
            0,
          );
          const payrollThisTick = totalPayrollPerMinute * (GAME_TICK_MS / 60_000);

          if (next.resources.coins <= 0 || next.resources.coins < payrollThisTick) {
            next = {
              ...next,
              resources: {
                ...next.resources,
                coins: Math.max(0, next.resources.coins - payrollThisTick),
              },
              activeCraftingSpecialists: {},
              activeCrafts: Object.fromEntries(
                Object.entries(next.activeCrafts).filter(([key]) => !key.startsWith('specialist:')),
              ),
            };
            changed = true;
            setTimeout(() => {
              addToast('Crafting specialists stopped because the forge ran out of coins.', 'warning');
            }, 0);
          } else {
            next = {
              ...next,
              resources: {
                ...next.resources,
                coins: next.resources.coins - payrollThisTick,
              },
            };
            changed = true;

            for (const item of activeSpecialistItems) {
              const craftKey = getCraftingSpecialistCraftKey(item.id);
              let activeCraft = next.activeCrafts[craftKey];

              if (!activeCraft && canAffordCraftable(next, item)) {
                next = {
                  ...next,
                  activeCrafts: {
                    ...next.activeCrafts,
                    [craftKey]: {
                      itemId: item.id,
                      elapsedMs: 0,
                      requiredMs: item.requiredCraftTimeMs ?? 1_000,
                      source: 'auto',
                      expertId: craftKey,
                    },
                  },
                };
                activeCraft = next.activeCrafts[craftKey];
              }

              if (!activeCraft) continue;

              const elapsedMs = activeCraft.elapsedMs +
                (GAME_TICK_MS * modifiers.automationSpeed * getCraftSpeedMultiplierForItem(item, modifiers));
              if (elapsedMs >= activeCraft.requiredMs) {
                const activeCrafts = { ...next.activeCrafts };
                delete activeCrafts[craftKey];

                if (canAffordCraftable(next, item)) {
                  next = recordCraftedItem({ ...next, activeCrafts }, item, 'auto') ?? { ...next, activeCrafts };
                } else {
                  next = {
                    ...next,
                    activeCrafts,
                  };
                }
              } else {
                next = {
                  ...next,
                  activeCrafts: {
                    ...next.activeCrafts,
                    [craftKey]: {
                      ...activeCraft,
                      elapsedMs,
                    },
                  },
                };
              }
            }
          }
        }

        return changed ? checkAchievements(next) : prev;
      });
    }, GAME_TICK_MS);

    return () => clearInterval(interval);
  }, [addToast, checkAchievements]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        let activeEvents = prev.news.activeEvents.filter((event) => event.expiresAt > now);
        const expiredEvents = prev.news.activeEvents
          .filter((event) => event.expiresAt <= now)
          .map((event) => ({ ...event, hasBeenSeen: event.hasBeenSeen || prev.news.seenBreakingEventIds.includes(event.id) }));
        let newsHistory = [...expiredEvents, ...prev.news.newsHistory]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, NEWS_HISTORY_LIMIT);
        let lastNewsGeneratedAt = prev.news.lastNewsGeneratedAt;
        let generated = false;

        if (lastNewsGeneratedAt === null) {
          lastNewsGeneratedAt = now - NEWS_EVENT_INTERVAL_MS + INITIAL_NEWS_EVENT_DELAY_MS;
        }

        if (activeEvents.length < MAX_ACTIVE_NEWS_EVENTS && now - lastNewsGeneratedAt >= NEWS_EVENT_INTERVAL_MS) {
          const event = generateNewsEvent(now);
          activeEvents = [event, ...activeEvents].slice(0, MAX_ACTIVE_NEWS_EVENTS);
          lastNewsGeneratedAt = now;
          generated = true;
          setTimeout(() => {
            addToast(`Breaking news: ${event.headline}`, event.isBreaking ? 'warning' : 'info');
          }, 0);
        }

        const activeModifiers = getActiveEventModifiers(activeEvents);
        const hasPositive = activeModifiers.positiveEffectCount > 0;
        const hasNegative = activeModifiers.negativeEffectCount > 0;
        const allEvents = [...activeEvents, ...newsHistory];
        const mostImpactful = allEvents
          .slice()
          .sort((a, b) => getEventImpactScore(b) - getEventImpactScore(a))[0];
        const changed = generated || expiredEvents.length > 0 || hasPositive || hasNegative || prev.news.lastNewsGeneratedAt === null;

        if (!changed) return prev;

        return {
          ...prev,
          news: {
            ...prev.news,
            activeEvents,
            newsHistory,
            lastNewsGeneratedAt,
            totalNewsEventsSeen: prev.news.totalNewsEventsSeen + (generated ? 1 : 0),
          },
          stats: {
            ...prev.stats,
            totalNewsEventsSeen: prev.stats.totalNewsEventsSeen + (generated ? 1 : 0),
            mostImpactfulNewsEventHeadline: mostImpactful?.headline ?? prev.stats.mostImpactfulNewsEventHeadline,
            timeUnderPositiveNewsMs: prev.stats.timeUnderPositiveNewsMs + (hasPositive ? NEWS_EVENT_TICK_MS : 0),
            timeUnderNegativeNewsMs: prev.stats.timeUnderNegativeNewsMs + (hasNegative ? NEWS_EVENT_TICK_MS : 0),
          },
        };
      });
    }, NEWS_EVENT_TICK_MS);

    return () => clearInterval(interval);
  }, [addToast]);

  const modifiers = computeModifiers(state);

  return {
    state,
    modifiers,
    toasts,
    floatingTexts,
    gatherMaterial,
    craftItem,
    unlockMaterial,
    toggleCraftingSpecialist,
    sellItem,
    buyUpgrade,
    sendTreasureHunter,
    recordLeaderboardSync,
    resetGame,
    markBreakingNewsSeen,
    addToast,
  };
}
