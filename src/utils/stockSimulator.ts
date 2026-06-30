import { STOCK_COMPANY_DEFINITIONS } from '../data/stockCompanies';
import type { StockCompany, StockMarketState, StockNewsArticle, StockSector } from '../types/stocks';
import {
  INITIAL_STOCK_MARKET_STATE,
  STOCK_NEWS_HISTORY_LIMIT,
  STOCK_PRICE_HISTORY_LIMIT,
} from '../types/stocks';

function clampPrice(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.round(value * 100) / 100);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function createInitialStockCompanies(now = Date.now()): StockCompany[] {
  return STOCK_COMPANY_DEFINITIONS.map((definition) => ({
    id: definition.id,
    name: definition.name,
    ticker: definition.ticker,
    sector: definition.sector,
    description: definition.description,
    currentPrice: definition.basePrice,
    previousPrice: definition.basePrice,
    priceHistory: Array.from({ length: 18 }, (_, index) =>
      clampPrice(definition.basePrice * (1 + Math.sin(index / 2) * 0.012 + randomBetween(-0.01, 0.01))),
    ),
    volatility: definition.volatility,
    trendBias: definition.trendBias,
    marketCapTier: definition.marketCapTier,
    dividendYield: definition.dividendYield,
    riskLevel: definition.riskLevel,
    lastUpdatedAt: now,
  }));
}

export function createInitialStockMarketState(now = Date.now()): StockMarketState {
  return {
    ...INITIAL_STOCK_MARKET_STATE,
    companies: createInitialStockCompanies(now),
    portfolio: {},
    transactions: [],
    stockNewsHistory: [],
    activeStockNews: [],
    seenStockNewsIds: [],
    marketStats: { ...INITIAL_STOCK_MARKET_STATE.marketStats },
    lastStockUpdateAt: now,
    lastStockNewsGeneratedAt: null,
  };
}

function stockAffectedByNews(company: StockCompany, article: StockNewsArticle): boolean {
  if (article.impactType === 'market_wide') return true;
  if (article.affectedTickers.includes(company.ticker)) return true;
  return article.affectedSectors.includes(company.sector);
}

function getNewsMove(company: StockCompany, activeNews: StockNewsArticle[]): number {
  return activeNews.reduce((move, article) => {
    if (!stockAffectedByNews(company, article)) return move;
    const impact = article.priceImpactPercent / 100;
    if (article.sentiment === 'neutral') return move + randomBetween(-impact, impact);
    return move + impact;
  }, 0);
}

function getNewsVolatility(company: StockCompany, activeNews: StockNewsArticle[]): number {
  return activeNews.reduce((volatility, article) => {
    if (!stockAffectedByNews(company, article)) return volatility;
    return volatility + article.volatilityImpact;
  }, 0);
}

export function updateStockPrices(stockMarket: StockMarketState, now = Date.now()): StockMarketState {
  const activeStockNews = stockMarket.activeStockNews.filter((article) => article.expiresAt > now);
  const expiredNews = stockMarket.activeStockNews.filter((article) => article.expiresAt <= now);
  const companies = stockMarket.companies.map((company) => {
    const randomMove = randomBetween(-0.01, 0.01);
    const largeMove = Math.random() < 0.035 ? randomBetween(-0.055, 0.055) : 0;
    const newsMove = getNewsMove(company, activeStockNews) * 0.22;
    const volatilityBoost = getNewsVolatility(company, activeStockNews);
    const move = (randomMove + company.trendBias / 100 + largeMove) * (company.volatility + volatilityBoost) + newsMove;
    const currentPrice = clampPrice(company.currentPrice * (1 + move));

    return {
      ...company,
      previousPrice: company.currentPrice,
      currentPrice,
      priceHistory: [...company.priceHistory, currentPrice].slice(-STOCK_PRICE_HISTORY_LIMIT),
      lastUpdatedAt: now,
    };
  });

  return {
    ...stockMarket,
    companies,
    activeStockNews,
    stockNewsHistory: [...expiredNews, ...stockMarket.stockNewsHistory]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, STOCK_NEWS_HISTORY_LIMIT),
    lastStockUpdateAt: now,
  };
}

export function applyImmediateStockNewsShock(
  stockMarket: StockMarketState,
  article: StockNewsArticle,
): StockMarketState {
  const companies = stockMarket.companies.map((company) => {
    if (!stockAffectedByNews(company, article)) return company;

    const impact = article.sentiment === 'neutral'
      ? randomBetween(-Math.abs(article.priceImpactPercent), Math.abs(article.priceImpactPercent)) / 100
      : article.priceImpactPercent / 100;
    const currentPrice = clampPrice(company.currentPrice * (1 + impact));

    return {
      ...company,
      previousPrice: company.currentPrice,
      currentPrice,
      priceHistory: [...company.priceHistory, currentPrice].slice(-STOCK_PRICE_HISTORY_LIMIT),
    };
  });

  return {
    ...stockMarket,
    companies,
    activeStockNews: [article, ...stockMarket.activeStockNews].slice(0, 8),
    lastStockNewsGeneratedAt: article.createdAt,
    marketStats: {
      ...stockMarket.marketStats,
      marketNewsSeen: stockMarket.marketStats.marketNewsSeen + 1,
    },
  };
}

export function getCompanyChangePercent(company: StockCompany): number {
  if (company.previousPrice <= 0) return 0;
  return ((company.currentPrice - company.previousPrice) / company.previousPrice) * 100;
}

export function getAffectedLabel(article: StockNewsArticle): string {
  if (article.impactType === 'market_wide') return 'Entire market';
  if (article.affectedSectors.length > 0) return article.affectedSectors.join(', ');
  return article.affectedTickers.join(', ');
}

export function getCompaniesBySector(companies: StockCompany[], sector: StockSector): StockCompany[] {
  return companies.filter((company) => company.sector === sector);
}
