export type StockSector =
  | 'Beverages'
  | 'Agriculture'
  | 'Food'
  | 'Clothing'
  | 'Transport'
  | 'Logistics'
  | 'Retail'
  | 'Travel'
  | 'Entertainment'
  | 'Home Goods'
  | 'Publishing'
  | 'Manufacturing'
  | 'Hospitality'
  | 'Beauty'
  | 'Health'
  | 'Education'
  | 'Services'
  | 'Utilities'
  | 'Toys';

export type StockRiskLevel = 'low' | 'moderate' | 'high' | 'wild';

export type MarketCapTier = 'small' | 'mid' | 'large';

export type StockNewsSentiment = 'positive' | 'negative' | 'neutral';

export type StockNewsImpactType = 'single_stock' | 'sector' | 'multi_stock' | 'market_wide';

export interface StockCompany {
  id: string;
  name: string;
  ticker: string;
  sector: StockSector;
  description: string;
  currentPrice: number;
  previousPrice: number;
  priceHistory: number[];
  volatility: number;
  trendBias: number;
  marketCapTier: MarketCapTier;
  dividendYield?: number;
  riskLevel: StockRiskLevel;
  lastUpdatedAt: number;
}

export interface StockPosition {
  ticker: string;
  shares: number;
  averagePurchasePrice: number;
}

export interface StockTransaction {
  id: string;
  ticker: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  total: number;
  profitLoss?: number;
  createdAt: number;
  newsSentimentAtTrade?: StockNewsSentiment | null;
}

export interface StockNewsArticle {
  id: string;
  headline: string;
  source: string;
  body: string;
  summary: string;
  sentiment: StockNewsSentiment;
  impactType: StockNewsImpactType;
  affectedTickers: string[];
  affectedSectors: StockSector[];
  priceImpactPercent: number;
  volatilityImpact: number;
  durationSeconds: number;
  createdAt: number;
  expiresAt: number;
  isBreaking: boolean;
  hasBeenSeen: boolean;
}

export interface StockMarketStats {
  totalBuys: number;
  totalSells: number;
  realizedProfitLoss: number;
  dividendsEarned: number;
  bestTrade: number | null;
  worstTrade: number | null;
  marketNewsSeen: number;
  totalSharesBought: number;
  totalSharesSold: number;
  coinsLostFromNegativeMarketEvents: number;
  coinsGainedFromPositiveMarketEvents: number;
  panicSells: number;
  bullishBuys: number;
  disasterProfits: number;
}

export interface StockMarketState {
  companies: StockCompany[];
  portfolio: Record<string, StockPosition>;
  transactions: StockTransaction[];
  stockNewsHistory: StockNewsArticle[];
  activeStockNews: StockNewsArticle[];
  seenStockNewsIds: string[];
  lastStockUpdateAt: number | null;
  lastStockNewsGeneratedAt: number | null;
  marketStats: StockMarketStats;
}

export const STOCK_PRICE_HISTORY_LIMIT = 80;
export const STOCK_UPDATE_INTERVAL_MS = 3_000;
export const STOCK_NEWS_INTERVAL_MS = 90_000;
export const STOCK_TRANSACTION_FEE_RATE = 0.01;
export const STOCK_NEWS_HISTORY_LIMIT = 30;
export const STOCK_TRANSACTION_HISTORY_LIMIT = 80;

export const INITIAL_STOCK_MARKET_STATS: StockMarketStats = {
  totalBuys: 0,
  totalSells: 0,
  realizedProfitLoss: 0,
  dividendsEarned: 0,
  bestTrade: null,
  worstTrade: null,
  marketNewsSeen: 0,
  totalSharesBought: 0,
  totalSharesSold: 0,
  coinsLostFromNegativeMarketEvents: 0,
  coinsGainedFromPositiveMarketEvents: 0,
  panicSells: 0,
  bullishBuys: 0,
  disasterProfits: 0,
};

export const INITIAL_STOCK_MARKET_STATE: StockMarketState = {
  companies: [],
  portfolio: {},
  transactions: [],
  stockNewsHistory: [],
  activeStockNews: [],
  seenStockNewsIds: [],
  lastStockUpdateAt: null,
  lastStockNewsGeneratedAt: null,
  marketStats: { ...INITIAL_STOCK_MARKET_STATS },
};
