import { ITEMS_BY_ID } from '../data/items';
import { STOCK_COMPANY_DEFINITIONS } from '../data/stockCompanies';
import { UPGRADES_BY_ID } from '../data/upgrades';
import type {
  ContractClientType,
  ContractDifficulty,
  ContractRequirement,
  ContractRiskLevel,
  ContractStatus,
  ForgeContract,
} from '../types/contracts';
import {
  CONTRACT_HISTORY_LIMIT,
  INITIAL_CONTRACT_STATS,
  INITIAL_CONTRACTS_STATE,
  MAX_ACTIVE_CONTRACT_SLOTS,
} from '../types/contracts';
import type { BlacksmithExpert, CraftProgress, CraftableCategory, GameState, Rarity, ResourceKey } from '../types/game';
import {
  CRAFTABLE_CATEGORY_LABELS,
  GEM_ORDER,
  INITIAL_BLACKSMITH_EXPERTS,
  INITIAL_CATEGORY_COUNTS,
  INITIAL_GEM_INVENTORY,
  INITIAL_MATERIAL_UNLOCKS,
  INITIAL_RARITY_COUNTS,
  INITIAL_RESOURCES,
  MATERIAL_ORDER,
  createEmptyMaterialTotals,
  createInitialState,
} from '../types/game';
import type { EventEffect, NewsEvent, NewsEventType, NewsSeverity } from '../types/news';
import { INITIAL_NEWS_STATE } from '../types/news';
import type {
  StockCompany,
  StockMarketStats,
  StockNewsArticle,
  StockNewsImpactType,
  StockNewsSentiment,
  StockPosition,
  StockSector,
  StockTransaction,
} from '../types/stocks';
import {
  INITIAL_STOCK_MARKET_STATS,
  STOCK_NEWS_HISTORY_LIMIT,
  STOCK_PRICE_HISTORY_LIMIT,
  STOCK_TRANSACTION_HISTORY_LIMIT,
} from '../types/stocks';
import { createInitialStockCompanies } from './stockSimulator';

const SAVE_KEY = 'forge-rush-save-v1';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

function safeSignedNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function safeInteger(value: unknown): number {
  return Math.floor(safeNumber(value));
}

function safeDateString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

function safeNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function normalizeNewsEffect(value: unknown): EventEffect | null {
  const raw = asRecord(value);
  const type = raw.type;
  const multiplier = typeof raw.multiplier === 'number' && Number.isFinite(raw.multiplier)
    ? raw.multiplier
    : 1;
  const label = typeof raw.label === 'string' && raw.label.trim() ? raw.label : 'Market effect';
  const allowedTypes: EventEffect['type'][] = [
    'itemSellValueMultiplier',
    'categorySellValueMultiplier',
    'resourceGainMultiplier',
    'autoProductionMultiplier',
    'craftSpeedMultiplier',
    'reputationGainMultiplier',
    'upgradeCostMultiplier',
    'specificItemValueMultiplier',
    'specificResourceMultiplier',
  ];

  if (!allowedTypes.includes(type as EventEffect['type'])) return null;
  if (multiplier <= 0) return null;

  const effect: EventEffect = {
    type: type as EventEffect['type'],
    multiplier,
    label,
  };

  if (typeof raw.category === 'string' && Object.keys(CRAFTABLE_CATEGORY_LABELS).includes(raw.category)) {
    effect.category = raw.category as CraftableCategory;
  }
  if (typeof raw.resource === 'string' && MATERIAL_ORDER.includes(raw.resource as never)) {
    effect.resource = raw.resource as EventEffect['resource'];
  }
  if (typeof raw.itemId === 'string' && ITEMS_BY_ID[raw.itemId]) {
    effect.itemId = raw.itemId;
  }

  return effect;
}

function normalizeNewsEvent(value: unknown): NewsEvent | null {
  const raw = asRecord(value);
  const allowedTypes: NewsEventType[] = ['war', 'disaster', 'market', 'industry', 'festival', 'scandal', 'ad', 'propaganda', 'rumor'];
  const allowedSeverities: NewsSeverity[] = ['minor', 'moderate', 'major', 'legendary'];
  const type = raw.type;
  const severity = raw.severity;
  const createdAt = safeNumber(raw.createdAt);
  const expiresAt = safeNumber(raw.expiresAt);
  const effects = Array.isArray(raw.effects)
    ? raw.effects.map(normalizeNewsEffect).filter((effect): effect is EventEffect => effect !== null)
    : [];

  if (typeof raw.id !== 'string' || !raw.id.trim()) return null;
  if (!allowedTypes.includes(type as NewsEventType)) return null;
  if (!allowedSeverities.includes(severity as NewsSeverity)) return null;
  if (createdAt <= 0 || expiresAt <= 0 || expiresAt <= createdAt) return null;

  return {
    id: raw.id,
    type: type as NewsEventType,
    headline: typeof raw.headline === 'string' && raw.headline.trim() ? raw.headline : 'Untitled Market Notice',
    source: typeof raw.source === 'string' && raw.source.trim() ? raw.source : 'The Anvil Gazette',
    summary: typeof raw.summary === 'string' && raw.summary.trim() ? raw.summary : 'A market event is affecting the forge.',
    body: typeof raw.body === 'string' && raw.body.trim() ? raw.body : 'Details are still being hammered flat.',
    severity: severity as NewsSeverity,
    durationSeconds: Math.max(1, safeInteger(raw.durationSeconds)),
    createdAt,
    expiresAt,
    effects,
    isBreaking: raw.isBreaking === true,
    hasBeenSeen: raw.hasBeenSeen === true,
  };
}

function normalizeNewsState(value: unknown): GameState['news'] {
  const raw = asRecord(value);
  const now = Date.now();
  const activeEvents = Array.isArray(raw.activeEvents)
    ? raw.activeEvents.map(normalizeNewsEvent).filter((event): event is NewsEvent => event !== null && event.expiresAt > now)
    : [];
  const savedHistory = Array.isArray(raw.newsHistory)
    ? raw.newsHistory.map(normalizeNewsEvent).filter((event): event is NewsEvent => event !== null)
    : [];
  const expiredFromActive = Array.isArray(raw.activeEvents)
    ? raw.activeEvents.map(normalizeNewsEvent).filter((event): event is NewsEvent => event !== null && event.expiresAt <= now)
    : [];
  const newsHistory = [...expiredFromActive, ...savedHistory]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 30);

  return {
    activeEvents,
    newsHistory,
    seenBreakingEventIds: Array.isArray(raw.seenBreakingEventIds)
      ? raw.seenBreakingEventIds.filter((id): id is string => typeof id === 'string')
      : [...INITIAL_NEWS_STATE.seenBreakingEventIds],
    lastNewsGeneratedAt: typeof raw.lastNewsGeneratedAt === 'number' && Number.isFinite(raw.lastNewsGeneratedAt)
      ? raw.lastNewsGeneratedAt
      : null,
    totalNewsEventsSeen: safeInteger(raw.totalNewsEventsSeen),
  };
}

function normalizeContractRequirement(value: unknown): ContractRequirement | null {
  const raw = asRecord(value);
  if (typeof raw.itemId !== 'string' || !ITEMS_BY_ID[raw.itemId]) return null;
  const quantity = safeInteger(raw.quantity);
  if (quantity <= 0) return null;
  return { itemId: raw.itemId, quantity };
}

function normalizeContract(value: unknown): ForgeContract | null {
  const raw = asRecord(value);
  const allowedClientTypes: ContractClientType[] = ['company', 'guild', 'kingdom', 'republic', 'merchant', 'military', 'research'];
  const allowedDifficulties: ContractDifficulty[] = ['easy', 'medium', 'hard', 'legendary'];
  const allowedStatuses: ContractStatus[] = ['available', 'active', 'completed', 'failed', 'expired'];
  const allowedRiskLevels: ContractRiskLevel[] = ['low', 'moderate', 'high', 'severe'];
  const requirements = Array.isArray(raw.requirements)
    ? raw.requirements
      .map(normalizeContractRequirement)
      .filter((requirement): requirement is ContractRequirement => requirement !== null)
    : [];

  if (typeof raw.id !== 'string' || !raw.id.trim()) return null;
  if (requirements.length === 0) return null;
  if (!allowedClientTypes.includes(raw.clientType as ContractClientType)) return null;
  if (!allowedDifficulties.includes(raw.difficulty as ContractDifficulty)) return null;
  if (!allowedStatuses.includes(raw.status as ContractStatus)) return null;

  const status = raw.status as ContractStatus;
  const createdAt = safeNumber(raw.createdAt);
  const offerExpiresAt = safeNumber(raw.offerExpiresAt);
  const activeExpiresAt = typeof raw.activeExpiresAt === 'number' && Number.isFinite(raw.activeExpiresAt)
    ? raw.activeExpiresAt
    : null;

  if (createdAt <= 0 || offerExpiresAt <= 0) return null;

  return {
    id: raw.id,
    clientName: typeof raw.clientName === 'string' && raw.clientName.trim() ? raw.clientName : 'Unknown Client',
    clientType: raw.clientType as ContractClientType,
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title : 'Forge Contract',
    description: typeof raw.description === 'string' && raw.description.trim()
      ? raw.description
      : 'A timed forge delivery contract.',
    requirements,
    difficulty: raw.difficulty as ContractDifficulty,
    rewardMultiplier: typeof raw.rewardMultiplier === 'number' && Number.isFinite(raw.rewardMultiplier)
      ? Math.max(1, raw.rewardMultiplier)
      : 2,
    rewardCoins: safeInteger(raw.rewardCoins),
    reputationReward: safeInteger(raw.reputationReward),
    failureCoinPenalty: safeInteger(raw.failureCoinPenalty),
    failureReputationPenalty: safeInteger(raw.failureReputationPenalty),
    offerExpiresAt,
    activeExpiresAt,
    status,
    createdAt,
    acceptedAt: typeof raw.acceptedAt === 'number' && Number.isFinite(raw.acceptedAt) ? raw.acceptedAt : null,
    completedAt: typeof raw.completedAt === 'number' && Number.isFinite(raw.completedAt) ? raw.completedAt : null,
    flavorText: typeof raw.flavorText === 'string' && raw.flavorText.trim() ? raw.flavorText : 'The posting is freshly inked.',
    riskLevel: allowedRiskLevels.includes(raw.riskLevel as ContractRiskLevel)
      ? raw.riskLevel as ContractRiskLevel
      : 'moderate',
    categoryHint: typeof raw.categoryHint === 'string' && Object.keys(CRAFTABLE_CATEGORY_LABELS).includes(raw.categoryHint)
      ? raw.categoryHint as CraftableCategory
      : undefined,
    rarityHint: typeof raw.rarityHint === 'string' && Object.keys(INITIAL_RARITY_COUNTS).includes(raw.rarityHint)
      ? raw.rarityHint as Rarity
      : undefined,
    completedWithSecondsRemaining: typeof raw.completedWithSecondsRemaining === 'number' && Number.isFinite(raw.completedWithSecondsRemaining)
      ? Math.max(0, Math.floor(raw.completedWithSecondsRemaining))
      : undefined,
  };
}

function normalizeContractsState(value: unknown): GameState['contracts'] {
  const raw = asRecord(value);
  const stats = asRecord(raw.contractStats);
  const slotCount = Math.min(
    MAX_ACTIVE_CONTRACT_SLOTS,
    Math.max(1, safeInteger(raw.unlockedContractSlots) || safeInteger(raw.activeContractSlots) || 1),
  );

  return {
    availableContracts: Array.isArray(raw.availableContracts)
      ? raw.availableContracts
        .map(normalizeContract)
        .filter((contract): contract is ForgeContract => contract !== null && contract.status === 'available')
        .slice(0, 5)
      : [...INITIAL_CONTRACTS_STATE.availableContracts],
    activeContracts: Array.isArray(raw.activeContracts)
      ? raw.activeContracts
        .map(normalizeContract)
        .filter((contract): contract is ForgeContract => contract !== null && contract.status === 'active')
        .slice(0, MAX_ACTIVE_CONTRACT_SLOTS)
      : [...INITIAL_CONTRACTS_STATE.activeContracts],
    contractHistory: Array.isArray(raw.contractHistory)
      ? raw.contractHistory
        .map(normalizeContract)
        .filter((contract): contract is ForgeContract =>
          contract !== null && ['completed', 'failed', 'expired'].includes(contract.status),
        )
        .sort((a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt))
        .slice(0, CONTRACT_HISTORY_LIMIT)
      : [...INITIAL_CONTRACTS_STATE.contractHistory],
    lastContractGeneratedAt: typeof raw.lastContractGeneratedAt === 'number' && Number.isFinite(raw.lastContractGeneratedAt)
      ? raw.lastContractGeneratedAt
      : null,
    activeContractSlots: slotCount,
    maxActiveContractSlots: MAX_ACTIVE_CONTRACT_SLOTS,
    unlockedContractSlots: slotCount,
    contractStats: {
      completed: safeInteger(stats.completed),
      failed: safeInteger(stats.failed),
      expired: safeInteger(stats.expired),
      coinsEarned: safeNumber(stats.coinsEarned),
      reputationEarned: safeNumber(stats.reputationEarned),
      reputationLost: safeNumber(stats.reputationLost),
      penaltiesPaid: safeNumber(stats.penaltiesPaid),
      largestReward: safeNumber(stats.largestReward),
      worstPenalty: safeNumber(stats.worstPenalty),
      slotsUnlocked: Math.max(1, safeInteger(stats.slotsUnlocked) || slotCount || INITIAL_CONTRACT_STATS.slotsUnlocked),
      legendaryCompleted: safeInteger(stats.legendaryCompleted),
      deadlineSurvivorCompletions: safeInteger(stats.deadlineSurvivorCompletions),
      currentCompletionStreak: safeInteger(stats.currentCompletionStreak),
      bestCompletionStreak: safeInteger(stats.bestCompletionStreak),
    },
  };
}

function normalizeStockCompany(value: unknown, fallback: StockCompany): StockCompany {
  const raw = asRecord(value);
  const currentPrice = typeof raw.currentPrice === 'number' && Number.isFinite(raw.currentPrice)
    ? Math.max(1, raw.currentPrice)
    : fallback.currentPrice;
  const previousPrice = typeof raw.previousPrice === 'number' && Number.isFinite(raw.previousPrice)
    ? Math.max(1, raw.previousPrice)
    : fallback.previousPrice;
  const priceHistory = Array.isArray(raw.priceHistory)
    ? raw.priceHistory
      .filter((price): price is number => typeof price === 'number' && Number.isFinite(price) && price >= 1)
      .slice(-STOCK_PRICE_HISTORY_LIMIT)
    : fallback.priceHistory;

  return {
    ...fallback,
    currentPrice,
    previousPrice,
    priceHistory: priceHistory.length > 0 ? priceHistory : fallback.priceHistory,
    volatility: typeof raw.volatility === 'number' && Number.isFinite(raw.volatility) && raw.volatility > 0
      ? raw.volatility
      : fallback.volatility,
    trendBias: typeof raw.trendBias === 'number' && Number.isFinite(raw.trendBias)
      ? raw.trendBias
      : fallback.trendBias,
    dividendYield: typeof raw.dividendYield === 'number' && Number.isFinite(raw.dividendYield)
      ? Math.max(0, raw.dividendYield)
      : fallback.dividendYield,
    lastUpdatedAt: typeof raw.lastUpdatedAt === 'number' && Number.isFinite(raw.lastUpdatedAt)
      ? raw.lastUpdatedAt
      : fallback.lastUpdatedAt,
  };
}

function normalizeStockNews(value: unknown): StockNewsArticle | null {
  const raw = asRecord(value);
  const sentiments: StockNewsSentiment[] = ['positive', 'negative', 'neutral'];
  const impactTypes: StockNewsImpactType[] = ['single_stock', 'sector', 'multi_stock', 'market_wide'];
  const sectors = STOCK_COMPANY_DEFINITIONS.map((company) => company.sector);

  if (typeof raw.id !== 'string' || !raw.id.trim()) return null;
  if (!sentiments.includes(raw.sentiment as StockNewsSentiment)) return null;
  if (!impactTypes.includes(raw.impactType as StockNewsImpactType)) return null;

  const createdAt = safeNumber(raw.createdAt);
  const expiresAt = safeNumber(raw.expiresAt);
  if (createdAt <= 0 || expiresAt <= 0 || expiresAt <= createdAt) return null;

  return {
    id: raw.id,
    headline: typeof raw.headline === 'string' && raw.headline.trim() ? raw.headline : 'Market bulletin',
    source: typeof raw.source === 'string' && raw.source.trim() ? raw.source : 'Forge Exchange Wire',
    body: typeof raw.body === 'string' && raw.body.trim() ? raw.body : 'Market desks are still sorting the details.',
    summary: typeof raw.summary === 'string' && raw.summary.trim() ? raw.summary : 'A fictional market event is affecting prices.',
    sentiment: raw.sentiment as StockNewsSentiment,
    impactType: raw.impactType as StockNewsImpactType,
    affectedTickers: Array.isArray(raw.affectedTickers)
      ? raw.affectedTickers.filter((ticker): ticker is string =>
        typeof ticker === 'string' && STOCK_COMPANY_DEFINITIONS.some((company) => company.ticker === ticker),
      )
      : [],
    affectedSectors: Array.isArray(raw.affectedSectors)
      ? raw.affectedSectors.filter((sector): sector is StockSector =>
        typeof sector === 'string' && sectors.includes(sector as StockSector),
      )
      : [],
    priceImpactPercent: safeSignedNumber(raw.priceImpactPercent),
    volatilityImpact: safeNumber(raw.volatilityImpact),
    durationSeconds: Math.max(1, safeInteger(raw.durationSeconds)),
    createdAt,
    expiresAt,
    isBreaking: raw.isBreaking === true,
    hasBeenSeen: raw.hasBeenSeen === true,
  };
}

function normalizeStockPosition(value: unknown): StockPosition | null {
  const raw = asRecord(value);
  if (typeof raw.ticker !== 'string') return null;
  if (!STOCK_COMPANY_DEFINITIONS.some((company) => company.ticker === raw.ticker)) return null;
  const shares = safeInteger(raw.shares);
  if (shares <= 0) return null;

  return {
    ticker: raw.ticker,
    shares,
    averagePurchasePrice: safeNumber(raw.averagePurchasePrice),
  };
}

function normalizeStockTransaction(value: unknown): StockTransaction | null {
  const raw = asRecord(value);
  if (typeof raw.id !== 'string' || !raw.id.trim()) return null;
  if (raw.type !== 'buy' && raw.type !== 'sell') return null;
  if (typeof raw.ticker !== 'string' || !STOCK_COMPANY_DEFINITIONS.some((company) => company.ticker === raw.ticker)) return null;

  return {
    id: raw.id,
    ticker: raw.ticker,
    type: raw.type,
    shares: safeInteger(raw.shares),
    price: safeNumber(raw.price),
    total: safeNumber(raw.total),
    profitLoss: typeof raw.profitLoss === 'number' && Number.isFinite(raw.profitLoss) ? raw.profitLoss : undefined,
    createdAt: safeNumber(raw.createdAt),
    newsSentimentAtTrade: raw.newsSentimentAtTrade === 'positive' || raw.newsSentimentAtTrade === 'negative' || raw.newsSentimentAtTrade === 'neutral'
      ? raw.newsSentimentAtTrade
      : null,
  };
}

function normalizeStockMarketStats(value: unknown): StockMarketStats {
  const raw = asRecord(value);
  return {
    ...INITIAL_STOCK_MARKET_STATS,
    totalBuys: safeInteger(raw.totalBuys),
    totalSells: safeInteger(raw.totalSells),
    realizedProfitLoss: safeSignedNumber(raw.realizedProfitLoss),
    dividendsEarned: safeNumber(raw.dividendsEarned),
    bestTrade: typeof raw.bestTrade === 'number' && Number.isFinite(raw.bestTrade) ? raw.bestTrade : null,
    worstTrade: typeof raw.worstTrade === 'number' && Number.isFinite(raw.worstTrade) ? raw.worstTrade : null,
    marketNewsSeen: safeInteger(raw.marketNewsSeen),
    totalSharesBought: safeInteger(raw.totalSharesBought),
    totalSharesSold: safeInteger(raw.totalSharesSold),
    coinsLostFromNegativeMarketEvents: safeNumber(raw.coinsLostFromNegativeMarketEvents),
    coinsGainedFromPositiveMarketEvents: safeNumber(raw.coinsGainedFromPositiveMarketEvents),
    panicSells: safeInteger(raw.panicSells),
    bullishBuys: safeInteger(raw.bullishBuys),
    disasterProfits: safeInteger(raw.disasterProfits),
  };
}

function normalizeStockMarketState(value: unknown): GameState['stockMarket'] {
  const raw = asRecord(value);
  const now = Date.now();
  const savedCompanies = Array.isArray(raw.companies) ? raw.companies.map(asRecord) : [];
  const fallbackCompanies = createInitialStockCompanies(now);
  const companies = fallbackCompanies.map((fallback) => {
    const saved = savedCompanies.find((company) => company.ticker === fallback.ticker);
    return normalizeStockCompany(saved, fallback);
  });
  const activeStockNews = Array.isArray(raw.activeStockNews)
    ? raw.activeStockNews
      .map(normalizeStockNews)
      .filter((article): article is StockNewsArticle => article !== null && article.expiresAt > now)
    : [];
  const expiredActiveNews = Array.isArray(raw.activeStockNews)
    ? raw.activeStockNews
      .map(normalizeStockNews)
      .filter((article): article is StockNewsArticle => article !== null && article.expiresAt <= now)
    : [];
  const savedNewsHistory = Array.isArray(raw.stockNewsHistory)
    ? raw.stockNewsHistory
      .map(normalizeStockNews)
      .filter((article): article is StockNewsArticle => article !== null)
    : [];
  const portfolioEntries = Object.entries(asRecord(raw.portfolio))
    .map(([, position]) => normalizeStockPosition(position))
    .filter((position): position is StockPosition => position !== null);

  return {
    companies,
    portfolio: Object.fromEntries(portfolioEntries.map((position) => [position.ticker, position])),
    transactions: Array.isArray(raw.transactions)
      ? raw.transactions
        .map(normalizeStockTransaction)
        .filter((transaction): transaction is StockTransaction => transaction !== null)
        .slice(-STOCK_TRANSACTION_HISTORY_LIMIT)
      : [],
    stockNewsHistory: [...expiredActiveNews, ...savedNewsHistory]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, STOCK_NEWS_HISTORY_LIMIT),
    activeStockNews,
    seenStockNewsIds: Array.isArray(raw.seenStockNewsIds)
      ? raw.seenStockNewsIds.filter((id): id is string => typeof id === 'string')
      : [],
    lastStockUpdateAt: typeof raw.lastStockUpdateAt === 'number' && Number.isFinite(raw.lastStockUpdateAt)
      ? raw.lastStockUpdateAt
      : now,
    lastStockNewsGeneratedAt: typeof raw.lastStockNewsGeneratedAt === 'number' && Number.isFinite(raw.lastStockNewsGeneratedAt)
      ? raw.lastStockNewsGeneratedAt
      : null,
    marketStats: normalizeStockMarketStats(raw.marketStats),
  };
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
    const source = craft.source === 'auto' || craft.source === 'expert' ? 'auto' : 'manual';
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
  const activeCraftingSpecialists = asRecord(raw.activeCraftingSpecialists);
  const normalizedResources = { ...INITIAL_RESOURCES };
  const normalizedCraftedCounts = Object.fromEntries(
    Object.entries(craftedCounts)
      .filter(([itemId, count]) => ITEMS_BY_ID[itemId] && safeInteger(count) > 0)
      .map(([itemId, count]) => [itemId, safeInteger(count)]),
  );
  const normalizedMaterialUnlocks = { ...INITIAL_MATERIAL_UNLOCKS };
  const normalizedCraftedByItem = Object.fromEntries(
    Object.entries(asRecord(stats.craftedByItem)).filter(([itemId, count]) =>
      ITEMS_BY_ID[itemId] && safeInteger(count) > 0,
    ).map(([itemId, count]) => [itemId, safeInteger(count)]),
  );
  const craftedByItem = Object.keys(normalizedCraftedByItem).length > 0
    ? normalizedCraftedByItem
    : normalizedCraftedCounts;
  const craftedByRarity = { ...INITIAL_RARITY_COUNTS };
  const craftedByCollection = { ...INITIAL_CATEGORY_COUNTS };
  const savedCraftedByRarity = asRecord(stats.craftedByRarity);
  const savedCraftedByCollection = asRecord(stats.craftedByCollection);
  const resourcesGainedManual = createEmptyMaterialTotals();
  const resourcesGainedAuto = createEmptyMaterialTotals();

  for (const rarity of Object.keys(INITIAL_RARITY_COUNTS) as Rarity[]) {
    craftedByRarity[rarity] = safeInteger(savedCraftedByRarity[rarity]);
  }

  for (const category of Object.keys(CRAFTABLE_CATEGORY_LABELS) as CraftableCategory[]) {
    craftedByCollection[category] = safeInteger(savedCraftedByCollection[category]);
  }

  if (Object.values(craftedByRarity).every((count) => count === 0)) {
    for (const [itemId, count] of Object.entries(craftedByItem)) {
      const item = ITEMS_BY_ID[itemId];
      if (item) craftedByRarity[item.rarity] += safeInteger(count);
    }
  }

  if (Object.values(craftedByCollection).every((count) => count === 0)) {
    for (const [itemId, count] of Object.entries(craftedByItem)) {
      const item = ITEMS_BY_ID[itemId];
      if (item) craftedByCollection[item.category] += safeInteger(count);
    }
  }

  for (const material of MATERIAL_ORDER) {
    resourcesGainedManual[material] = safeNumber(asRecord(stats.resourcesGainedManual)[material]);
    resourcesGainedAuto[material] = safeNumber(asRecord(stats.resourcesGainedAuto)[material]);
  }

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
      manualCrafts: safeInteger(stats.manualCrafts),
      autoCrafts: safeInteger(stats.autoCrafts),
      craftedByItem,
      craftedByRarity,
      craftedByCollection,
      resourcesGainedManual,
      resourcesGainedAuto,
      coinsSpentOnUpgrades: safeNumber(stats.coinsSpentOnUpgrades),
      totalItemsSold: safeInteger(stats.totalItemsSold),
      totalCoinsFromSelling: safeNumber(stats.totalCoinsFromSelling),
      firstPlayedAt: safeDateString(stats.firstPlayedAt) ?? new Date().toISOString(),
      lastSavedAt: safeDateString(stats.lastSavedAt),
      bestProductionPerSecond: safeNumber(stats.bestProductionPerSecond),
      bestSyncedReputation: safeNumber(stats.bestSyncedReputation),
      lastSyncedAt: safeDateString(stats.lastSyncedAt),
      totalNewsEventsSeen: safeInteger(stats.totalNewsEventsSeen),
      mostImpactfulNewsEventHeadline: safeNullableString(stats.mostImpactfulNewsEventHeadline),
      timeUnderPositiveNewsMs: safeNumber(stats.timeUnderPositiveNewsMs),
      timeUnderNegativeNewsMs: safeNumber(stats.timeUnderNegativeNewsMs),
      coinsGainedFromEventBonuses: safeNumber(stats.coinsGainedFromEventBonuses),
      reputationGainedFromEventBonuses: safeNumber(stats.reputationGainedFromEventBonuses),
    },
    achievementsUnlocked: Object.fromEntries(
      Object.entries(achievementsUnlocked)
        .filter(([, unlocked]) => unlocked === true),
    ) as Record<string, boolean>,
    blacksmithExperts: normalizeExperts(raw.blacksmithExperts),
    activeCraftingSpecialists: Object.fromEntries(
      Object.entries(activeCraftingSpecialists)
        .filter(([itemId, active]) => ITEMS_BY_ID[itemId] && active === true),
    ) as Record<string, boolean>,
    activeCrafts: normalizeActiveCrafts(raw.activeCrafts),
    news: normalizeNewsState(raw.news),
    contracts: normalizeContractsState(raw.contracts),
    stockMarket: normalizeStockMarketState(raw.stockMarket),
  };
}

export function saveGame(state: GameState): void {
  try {
    const normalized = normalizeGameState(state);
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      ...normalized,
      stats: {
        ...normalized.stats,
        lastSavedAt: new Date().toISOString(),
      },
    }));
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
