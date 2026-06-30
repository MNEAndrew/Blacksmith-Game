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
import {
  CONTRACT_ACTIVE_DURATION_MS,
  CONTRACT_HISTORY_LIMIT,
  CONTRACT_SLOT_COSTS,
  CONTRACT_TICK_MS,
  MAX_ACTIVE_CONTRACT_SLOTS,
  MAX_AVAILABLE_CONTRACTS,
  MIN_AVAILABLE_CONTRACTS,
  TARGET_AVAILABLE_CONTRACTS,
  type ForgeContract,
} from '../types/contracts';
import type { FloatingTextItem, GameState, GemKey, MaterialKey, ToastMessage } from '../types/game';
import { GEM_LABELS, GEM_ORDER, MATERIAL_LABELS, createEmptyMaterialTotals, createInitialState } from '../types/game';
import {
  STOCK_NEWS_INTERVAL_MS,
  STOCK_TRANSACTION_FEE_RATE,
  STOCK_TRANSACTION_HISTORY_LIMIT,
  STOCK_UPDATE_INTERVAL_MS,
  type StockNewsArticle,
  type StockTransaction,
} from '../types/stocks';
import { getActiveEventModifiers, getEventImpactScore } from '../utils/eventModifiers';
import {
  canFulfillContract,
  formatMissingContractItems,
  getMissingContractItems,
  removeInventoryItems,
} from '../utils/contractCalculations';
import { generateContract } from '../utils/contractGenerator';
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
import { calculatePortfolioSummary, getCompanyByTicker } from '../utils/portfolioCalculations';
import { clearSave, loadGame, saveGame } from '../utils/saveGame';
import { generateStockNews } from '../utils/stockNewsGenerator';
import {
  applyImmediateStockNewsShock,
  createInitialStockMarketState,
  updateStockPrices,
} from '../utils/stockSimulator';

let toastId = 0;
let floatId = 0;
const GAME_TICK_MS = 100;

function addContractsToHistory(
  history: ForgeContract[],
  contracts: ForgeContract[],
): ForgeContract[] {
  return [...contracts, ...history]
    .sort((a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt))
    .slice(0, CONTRACT_HISTORY_LIMIT);
}

function fillAvailableContracts(
  state: GameState,
  now: number,
): GameState {
  if (state.contracts.availableContracts.length >= MIN_AVAILABLE_CONTRACTS) return state;

  const modifiers = computeModifiers(state);
  const availableContracts = [...state.contracts.availableContracts];

  while (availableContracts.length < TARGET_AVAILABLE_CONTRACTS && availableContracts.length < MAX_AVAILABLE_CONTRACTS) {
    availableContracts.push(generateContract({ ...state, contracts: { ...state.contracts, availableContracts } }, modifiers, now));
  }

  return {
    ...state,
    contracts: {
      ...state.contracts,
      availableContracts,
      lastContractGeneratedAt: now,
    },
  };
}

function ensureStockMarketState(state: GameState, now: number): GameState {
  if (state.stockMarket.companies.length > 0) return state;
  return {
    ...state,
    stockMarket: createInitialStockMarketState(now),
  };
}

function stockNewsAffectsTicker(article: StockNewsArticle, ticker: string, state: GameState): boolean {
  if (article.impactType === 'market_wide') return true;
  if (article.affectedTickers.includes(ticker)) return true;
  const company = getCompanyByTicker(state.stockMarket.companies, ticker);
  return !!company && article.affectedSectors.includes(company.sector);
}

function getRecentStockNewsSentiment(state: GameState, ticker: string, now: number): StockNewsArticle['sentiment'] | null {
  const article = state.stockMarket.activeStockNews.find((news) =>
    now - news.createdAt <= 10_000 && stockNewsAffectsTicker(news, ticker, state),
  );
  return article?.sentiment ?? null;
}

function createStockTransaction(
  ticker: string,
  type: StockTransaction['type'],
  shares: number,
  price: number,
  total: number,
  createdAt: number,
  profitLoss?: number,
  newsSentimentAtTrade?: StockNewsArticle['sentiment'] | null,
): StockTransaction {
  return {
    id: `stock-tx-${createdAt.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    ticker,
    type,
    shares,
    price,
    total,
    profitLoss,
    createdAt,
    newsSentimentAtTrade,
  };
}

export function useGame() {
  const [state, setState] = useState<GameState>(() => {
    const now = Date.now();
    return fillAvailableContracts(ensureStockMarketState(loadGame() ?? createInitialState(), now), now);
  });
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

  const acceptContract = useCallback((contractId: string) => {
    setState((prev) => {
      const contract = prev.contracts.availableContracts.find((available) => available.id === contractId);
      if (!contract || contract.status !== 'available') return prev;

      const now = Date.now();
      if (contract.offerExpiresAt <= now) {
        addToast('That contract posting has already expired.', 'warning');
        return prev;
      }

      if (prev.contracts.activeContracts.length >= prev.contracts.unlockedContractSlots) {
        addToast('No active contract slots available. Complete a contract or unlock another slot.', 'warning');
        return prev;
      }

      const activeContract: ForgeContract = {
        ...contract,
        status: 'active',
        acceptedAt: now,
        activeExpiresAt: now + CONTRACT_ACTIVE_DURATION_MS[contract.difficulty],
      };

      addToast(`Contract accepted: ${contract.title}`, contract.difficulty === 'legendary' ? 'warning' : 'info');

      return {
        ...prev,
        contracts: {
          ...prev.contracts,
          availableContracts: prev.contracts.availableContracts.filter((available) => available.id !== contractId),
          activeContracts: [activeContract, ...prev.contracts.activeContracts].slice(0, MAX_ACTIVE_CONTRACT_SLOTS),
        },
      };
    });
  }, [addToast]);

  const deliverContract = useCallback((contractId: string) => {
    setState((prev) => {
      const contract = prev.contracts.activeContracts.find((active) => active.id === contractId);
      if (!contract || contract.status !== 'active') return prev;

      const missing = getMissingContractItems(contract, prev);
      if (missing.length > 0 || !canFulfillContract(contract, prev)) {
        addToast(`Not enough items to deliver. Missing: ${formatMissingContractItems(missing)}`, 'warning');
        return prev;
      }

      const now = Date.now();
      const secondsRemaining = contract.activeExpiresAt
        ? Math.max(0, Math.floor((contract.activeExpiresAt - now) / 1000))
        : 0;
      const completedContract: ForgeContract = {
        ...contract,
        status: 'completed',
        completedAt: now,
        completedWithSecondsRemaining: secondsRemaining,
      };
      const inventory = removeInventoryItems(prev.inventory, contract.requirements);
      const contractStats = prev.contracts.contractStats;
      const completed = contractStats.completed + 1;
      const deadlineSurvivor = secondsRemaining > 0 && secondsRemaining <= 10;
      const currentCompletionStreak = contractStats.currentCompletionStreak + 1;

      const next: GameState = {
        ...prev,
        resources: {
          ...prev.resources,
          coins: prev.resources.coins + contract.rewardCoins,
          reputation: prev.resources.reputation + contract.reputationReward,
        },
        inventory,
        stats: {
          ...prev.stats,
          totalCoinsEarned: prev.stats.totalCoinsEarned + contract.rewardCoins,
        },
        contracts: {
          ...prev.contracts,
          activeContracts: prev.contracts.activeContracts.filter((active) => active.id !== contractId),
          contractHistory: addContractsToHistory(prev.contracts.contractHistory, [completedContract]),
          contractStats: {
            ...contractStats,
            completed,
            coinsEarned: contractStats.coinsEarned + contract.rewardCoins,
            reputationEarned: contractStats.reputationEarned + contract.reputationReward,
            largestReward: Math.max(contractStats.largestReward, contract.rewardCoins),
            legendaryCompleted: contractStats.legendaryCompleted + (contract.difficulty === 'legendary' ? 1 : 0),
            deadlineSurvivorCompletions: contractStats.deadlineSurvivorCompletions + (deadlineSurvivor ? 1 : 0),
            currentCompletionStreak,
            bestCompletionStreak: Math.max(contractStats.bestCompletionStreak, currentCompletionStreak),
          },
        },
      };

      addToast(`Delivered ${contract.title} for ${contract.rewardCoins} coins (+${contract.reputationReward} rep).`, 'success');
      return checkAchievements(next);
    });
  }, [addToast, checkAchievements]);

  const unlockContractSlot = useCallback(() => {
    setState((prev) => {
      const currentSlots = Math.min(MAX_ACTIVE_CONTRACT_SLOTS, Math.max(1, prev.contracts.unlockedContractSlots));
      const nextSlot = currentSlots + 1;
      const cost = CONTRACT_SLOT_COSTS[nextSlot];

      if (!cost || nextSlot > MAX_ACTIVE_CONTRACT_SLOTS) {
        addToast('All active contract slots are already unlocked.', 'info');
        return prev;
      }

      if (prev.resources.coins < cost) {
        addToast(`Need ${cost} coins to unlock Contract Slot ${nextSlot}.`, 'warning');
        return prev;
      }

      const next: GameState = {
        ...prev,
        resources: {
          ...prev.resources,
          coins: prev.resources.coins - cost,
        },
        contracts: {
          ...prev.contracts,
          activeContractSlots: nextSlot,
          unlockedContractSlots: nextSlot,
          contractStats: {
            ...prev.contracts.contractStats,
            slotsUnlocked: nextSlot,
          },
        },
      };

      addToast(`Active Contract Slot ${nextSlot} unlocked.`, 'success');
      return checkAchievements(next);
    });
  }, [addToast, checkAchievements]);

  const buyStock = useCallback((ticker: string, shares: number) => {
    setState((prev) => {
      const quantity = Math.max(0, Math.floor(shares));
      if (quantity <= 0) return prev;

      const company = getCompanyByTicker(prev.stockMarket.companies, ticker);
      if (!company) return prev;

      const subtotal = company.currentPrice * quantity;
      const fee = Math.ceil(subtotal * STOCK_TRANSACTION_FEE_RATE);
      const totalCost = Math.ceil(subtotal + fee);

      if (prev.resources.coins < totalCost) {
        addToast(`Need ${totalCost} coins to buy ${quantity} ${ticker}.`, 'warning');
        return prev;
      }

      const now = Date.now();
      const existing = prev.stockMarket.portfolio[ticker];
      const existingShares = existing?.shares ?? 0;
      const existingCost = existingShares * (existing?.averagePurchasePrice ?? 0);
      const averagePurchasePrice = (existingCost + subtotal) / (existingShares + quantity);
      const newsSentiment = getRecentStockNewsSentiment(prev, ticker, now);
      const transaction = createStockTransaction(ticker, 'buy', quantity, company.currentPrice, totalCost, now, undefined, newsSentiment);
      const next: GameState = {
        ...prev,
        resources: {
          ...prev.resources,
          coins: prev.resources.coins - totalCost,
        },
        stockMarket: {
          ...prev.stockMarket,
          portfolio: {
            ...prev.stockMarket.portfolio,
            [ticker]: {
              ticker,
              shares: existingShares + quantity,
              averagePurchasePrice,
            },
          },
          transactions: [...prev.stockMarket.transactions, transaction].slice(-STOCK_TRANSACTION_HISTORY_LIMIT),
          marketStats: {
            ...prev.stockMarket.marketStats,
            totalBuys: prev.stockMarket.marketStats.totalBuys + 1,
            totalSharesBought: prev.stockMarket.marketStats.totalSharesBought + quantity,
            bullishBuys: prev.stockMarket.marketStats.bullishBuys + (newsSentiment === 'positive' ? 1 : 0),
          },
        },
      };

      addToast(`Bought ${quantity} ${ticker} for ${totalCost} coins.`, 'success');
      return checkAchievements(next);
    });
  }, [addToast, checkAchievements]);

  const sellStock = useCallback((ticker: string, shares: number | 'all') => {
    setState((prev) => {
      const company = getCompanyByTicker(prev.stockMarket.companies, ticker);
      const position = prev.stockMarket.portfolio[ticker];
      if (!company || !position || position.shares <= 0) {
        addToast(`You do not own ${ticker}.`, 'warning');
        return prev;
      }

      const quantity = shares === 'all'
        ? position.shares
        : Math.max(0, Math.floor(shares));
      if (quantity <= 0) return prev;
      if (quantity > position.shares) {
        addToast(`You only own ${position.shares} ${ticker}.`, 'warning');
        return prev;
      }

      const now = Date.now();
      const subtotal = company.currentPrice * quantity;
      const fee = Math.ceil(subtotal * STOCK_TRANSACTION_FEE_RATE);
      const saleValue = Math.max(0, Math.floor(subtotal - fee));
      const costBasis = position.averagePurchasePrice * quantity;
      const profitLoss = saleValue - costBasis;
      const remainingShares = position.shares - quantity;
      const portfolio = { ...prev.stockMarket.portfolio };
      const newsSentiment = getRecentStockNewsSentiment(prev, ticker, now);
      const panicSell = newsSentiment === 'negative';
      const disasterProfit = panicSell && profitLoss > 0;

      if (remainingShares > 0) {
        portfolio[ticker] = {
          ...position,
          shares: remainingShares,
        };
      } else {
        delete portfolio[ticker];
      }

      const transaction = createStockTransaction(ticker, 'sell', quantity, company.currentPrice, saleValue, now, profitLoss, newsSentiment);
      const next: GameState = {
        ...prev,
        resources: {
          ...prev.resources,
          coins: prev.resources.coins + saleValue,
        },
        stockMarket: {
          ...prev.stockMarket,
          portfolio,
          transactions: [...prev.stockMarket.transactions, transaction].slice(-STOCK_TRANSACTION_HISTORY_LIMIT),
          marketStats: {
            ...prev.stockMarket.marketStats,
            totalSells: prev.stockMarket.marketStats.totalSells + 1,
            totalSharesSold: prev.stockMarket.marketStats.totalSharesSold + quantity,
            realizedProfitLoss: prev.stockMarket.marketStats.realizedProfitLoss + profitLoss,
            bestTrade: prev.stockMarket.marketStats.bestTrade === null
              ? profitLoss
              : Math.max(prev.stockMarket.marketStats.bestTrade, profitLoss),
            worstTrade: prev.stockMarket.marketStats.worstTrade === null
              ? profitLoss
              : Math.min(prev.stockMarket.marketStats.worstTrade, profitLoss),
            panicSells: prev.stockMarket.marketStats.panicSells + (panicSell ? 1 : 0),
            disasterProfits: prev.stockMarket.marketStats.disasterProfits + (disasterProfit ? 1 : 0),
          },
        },
      };

      addToast(
        profitLoss >= 0
          ? `Sold ${quantity} ${ticker} for ${saleValue} coins (+${Math.floor(profitLoss)}).`
          : `Sold ${quantity} ${ticker} for ${saleValue} coins (${Math.floor(profitLoss)} loss).`,
        profitLoss >= 0 ? 'success' : 'warning',
      );
      return checkAchievements(next);
    });
  }, [addToast, checkAchievements]);

  const markStockNewsSeen = useCallback((newsId: string) => {
    setState((prev) => {
      if (prev.stockMarket.seenStockNewsIds.includes(newsId)) return prev;

      return {
        ...prev,
        stockMarket: {
          ...prev.stockMarket,
          seenStockNewsIds: [...prev.stockMarket.seenStockNewsIds, newsId],
          activeStockNews: prev.stockMarket.activeStockNews.map((article) =>
            article.id === newsId ? { ...article, hasBeenSeen: true } : article,
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

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        const expiredAvailable = prev.contracts.availableContracts
          .filter((contract) => contract.offerExpiresAt <= now)
          .map((contract): ForgeContract => ({
            ...contract,
            status: 'expired',
            completedAt: now,
          }));
        const stillAvailable = prev.contracts.availableContracts.filter((contract) => contract.offerExpiresAt > now);
        const failedActive = prev.contracts.activeContracts
          .filter((contract) => contract.activeExpiresAt !== null && contract.activeExpiresAt <= now)
          .map((contract): ForgeContract => ({
            ...contract,
            status: 'failed',
            completedAt: now,
          }));
        const stillActive = prev.contracts.activeContracts.filter((contract) =>
          contract.activeExpiresAt === null || contract.activeExpiresAt > now,
        );
        const lowTimerContract = stillActive.find((contract) =>
          contract.activeExpiresAt !== null &&
          contract.activeExpiresAt - now <= 30_000 &&
          contract.activeExpiresAt - now > 29_000,
        );

        let next: GameState = prev;
        let changed = false;

        if (expiredAvailable.length > 0 || failedActive.length > 0) {
          let coins = prev.resources.coins;
          let reputation = prev.resources.reputation;
          let penaltiesPaid = 0;
          let reputationLost = 0;
          let worstPenalty = prev.contracts.contractStats.worstPenalty;

          for (const contract of failedActive) {
            const requiredPenalty = Math.max(0, contract.failureCoinPenalty);
            const paid = Math.min(coins, requiredPenalty);
            const shortfall = Math.max(0, requiredPenalty - paid);
            const extraReputationLoss = shortfall > 0 ? Math.ceil(shortfall / 250) : 0;
            const contractReputationLoss = contract.failureReputationPenalty + extraReputationLoss;

            coins = Math.max(0, coins - requiredPenalty);
            reputation = Math.max(0, reputation - contractReputationLoss);
            penaltiesPaid += paid;
            reputationLost += Math.min(prev.resources.reputation, contractReputationLoss);
            worstPenalty = Math.max(worstPenalty, requiredPenalty);
          }

          next = {
            ...prev,
            resources: {
              ...prev.resources,
              coins,
              reputation,
            },
            contracts: {
              ...prev.contracts,
              availableContracts: stillAvailable,
              activeContracts: stillActive,
              contractHistory: addContractsToHistory(prev.contracts.contractHistory, [...failedActive, ...expiredAvailable]),
              contractStats: {
                ...prev.contracts.contractStats,
                expired: prev.contracts.contractStats.expired + expiredAvailable.length,
                failed: prev.contracts.contractStats.failed + failedActive.length,
                penaltiesPaid: prev.contracts.contractStats.penaltiesPaid + penaltiesPaid,
                reputationLost: prev.contracts.contractStats.reputationLost + reputationLost,
                worstPenalty,
                currentCompletionStreak: failedActive.length > 0 ? 0 : prev.contracts.contractStats.currentCompletionStreak,
              },
            },
          };
          changed = true;

          if (expiredAvailable.length > 0) {
            setTimeout(() => {
              addToast(`${expiredAvailable.length} contract posting${expiredAvailable.length === 1 ? '' : 's'} expired.`, 'info');
            }, 0);
          }

          if (failedActive.length > 0) {
            setTimeout(() => {
              addToast(`${failedActive.length} accepted contract${failedActive.length === 1 ? '' : 's'} failed. Penalties applied.`, 'warning');
            }, 0);
          }
        }

        const filled = fillAvailableContracts(next, now);
        if (filled !== next) {
          next = filled;
          changed = true;
          if (prev.contracts.availableContracts.length > 0) {
            setTimeout(() => {
              addToast('New contract available on the trade board.', 'info');
            }, 0);
          }
        }

        if (lowTimerContract) {
          setTimeout(() => {
            addToast(`Contract timer low: ${lowTimerContract.title} has under 30 seconds.`, 'warning');
          }, 0);
        }

        return changed ? checkAchievements(next) : prev;
      });
    }, CONTRACT_TICK_MS);

    return () => clearInterval(interval);
  }, [addToast, checkAchievements]);

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        let stockMarket = updateStockPrices(prev.stockMarket, now);
        let generatedNews: StockNewsArticle | null = null;
        const lastNewsAt = stockMarket.lastStockNewsGeneratedAt ?? (now - STOCK_NEWS_INTERVAL_MS + 20_000);

        if (now - lastNewsAt >= STOCK_NEWS_INTERVAL_MS) {
          const beforeValue = calculatePortfolioSummary(stockMarket).totalPortfolioValue;
          generatedNews = generateStockNews(stockMarket.companies, now);
          stockMarket = applyImmediateStockNewsShock(stockMarket, generatedNews);
          const afterValue = calculatePortfolioSummary(stockMarket).totalPortfolioValue;
          const portfolioDelta = afterValue - beforeValue;

          stockMarket = {
            ...stockMarket,
            marketStats: {
              ...stockMarket.marketStats,
              coinsLostFromNegativeMarketEvents: stockMarket.marketStats.coinsLostFromNegativeMarketEvents +
                (generatedNews.sentiment === 'negative' ? Math.max(0, -portfolioDelta) : 0),
              coinsGainedFromPositiveMarketEvents: stockMarket.marketStats.coinsGainedFromPositiveMarketEvents +
                (generatedNews.sentiment === 'positive' ? Math.max(0, portfolioDelta) : 0),
            },
          };

          setTimeout(() => {
            addToast(`Market news: ${generatedNews?.headline}`, generatedNews?.sentiment === 'negative' ? 'warning' : 'info');
          }, 0);
        }

        return {
          ...prev,
          stockMarket,
        };
      });
    }, STOCK_UPDATE_INTERVAL_MS);

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
    acceptContract,
    deliverContract,
    unlockContractSlot,
    buyStock,
    sellStock,
    markStockNewsSeen,
    addToast,
  };
}
