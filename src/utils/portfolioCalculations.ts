import type { StockCompany, StockMarketState, StockPosition } from '../types/stocks';

export interface HoldingSummary {
  ticker: string;
  shares: number;
  averagePurchasePrice: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface PortfolioSummary {
  holdings: HoldingSummary[];
  totalPortfolioValue: number;
  totalInvested: number;
  unrealizedProfitLoss: number;
  biggestHolding: HoldingSummary | null;
  bestPerformer: HoldingSummary | null;
  worstPerformer: HoldingSummary | null;
}

export function getCompanyByTicker(companies: StockCompany[], ticker: string): StockCompany | undefined {
  return companies.find((company) => company.ticker === ticker);
}

export function getStockPosition(portfolio: StockMarketState['portfolio'], ticker: string): StockPosition | null {
  const position = portfolio[ticker];
  if (!position || !Number.isFinite(position.shares) || position.shares <= 0) return null;
  return position;
}

export function calculatePortfolioSummary(stockMarket: StockMarketState): PortfolioSummary {
  const holdings = Object.values(stockMarket.portfolio)
    .filter((position) => position.shares > 0)
    .map((position): HoldingSummary | null => {
      const company = getCompanyByTicker(stockMarket.companies, position.ticker);
      if (!company) return null;

      const shares = Math.max(0, Math.floor(position.shares));
      const averagePurchasePrice = Math.max(0, position.averagePurchasePrice);
      const currentValue = shares * company.currentPrice;
      const costBasis = shares * averagePurchasePrice;
      const profitLoss = currentValue - costBasis;
      const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

      return {
        ticker: position.ticker,
        shares,
        averagePurchasePrice,
        currentPrice: company.currentPrice,
        currentValue,
        costBasis,
        profitLoss,
        profitLossPercent,
      };
    })
    .filter((holding): holding is HoldingSummary => holding !== null);

  const totalPortfolioValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
  const totalInvested = holdings.reduce((sum, holding) => sum + holding.costBasis, 0);
  const unrealizedProfitLoss = totalPortfolioValue - totalInvested;
  const biggestHolding = holdings.slice().sort((a, b) => b.currentValue - a.currentValue)[0] ?? null;
  const bestPerformer = holdings.slice().sort((a, b) => b.profitLossPercent - a.profitLossPercent)[0] ?? null;
  const worstPerformer = holdings.slice().sort((a, b) => a.profitLossPercent - b.profitLossPercent)[0] ?? null;

  return {
    holdings,
    totalPortfolioValue,
    totalInvested,
    unrealizedProfitLoss,
    biggestHolding,
    bestPerformer,
    worstPerformer,
  };
}

export function getFavoriteStock(transactions: StockMarketState['transactions']): string | null {
  const counts = new Map<string, number>();
  for (const transaction of transactions) {
    counts.set(transaction.ticker, (counts.get(transaction.ticker) ?? 0) + transaction.shares);
  }

  return [...counts.entries()].sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
}

export function getSectorOwnershipCount(stockMarket: StockMarketState, sector: string): number {
  return Object.values(stockMarket.portfolio).filter((position) => {
    if (position.shares <= 0) return false;
    return getCompanyByTicker(stockMarket.companies, position.ticker)?.sector === sector;
  }).length;
}
