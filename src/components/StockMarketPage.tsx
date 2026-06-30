import { useMemo, useState } from 'react';
import { PortfolioPanel } from './PortfolioPanel';
import { ResourceBar } from './ResourceBar';
import { StockCompanyCard } from './StockCompanyCard';
import { StockDetailModal } from './StockDetailModal';
import { StockNewsPanel } from './StockNewsPanel';
import { STOCK_SECTORS } from '../data/stockCompanies';
import type { GameState } from '../types/game';
import { calculatePortfolioSummary, getCompanyByTicker, getFavoriteStock, getStockPosition } from '../utils/portfolioCalculations';
import { formatNumber } from '../utils/gameLogic';

interface StockMarketPageProps {
  state: GameState;
  onBuyStock: (ticker: string, shares: number) => void;
  onSellStock: (ticker: string, shares: number | 'all') => void;
}

function OverviewTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="stock-overview-tile">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

export function StockMarketPage({ state, onBuyStock, onSellStock }: StockMarketPageProps) {
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('all');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const stockMarket = state.stockMarket;
  const portfolioSummary = calculatePortfolioSummary(stockMarket);
  const favoriteStock = getFavoriteStock(stockMarket.transactions);
  const selectedCompany = selectedTicker ? getCompanyByTicker(stockMarket.companies, selectedTicker) ?? null : null;

  const filteredCompanies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return stockMarket.companies.filter((company) => {
      const matchesSector = sector === 'all' || company.sector === sector;
      const matchesQuery = !normalizedQuery ||
        company.name.toLowerCase().includes(normalizedQuery) ||
        company.ticker.toLowerCase().includes(normalizedQuery) ||
        company.sector.toLowerCase().includes(normalizedQuery);
      return matchesSector && matchesQuery;
    });
  }, [query, sector, stockMarket.companies]);

  return (
    <main className="stock-page">
      <ResourceBar state={state} />

      <section className="stock-hero">
        <div>
          <p className="stock-hero__eyebrow">Forge Exchange</p>
          <h2>Stock Market</h2>
          <p>Buy and sell shares in fictional companies using Forge Rush coins.</p>
        </div>
        <div className="stock-hero__summary">
          <span>{stockMarket.companies.length} tickers</span>
          <span>{stockMarket.activeStockNews.length} active bulletins</span>
        </div>
      </section>

      <section className="panel stock-section" aria-labelledby="stock-overview-heading">
        <h2 id="stock-overview-heading">Market Overview</h2>
        <div className="stock-overview-grid">
          <OverviewTile label="Portfolio Value" value={formatNumber(portfolioSummary.totalPortfolioValue)} />
          <OverviewTile label="Available Coins" value={formatNumber(state.resources.coins)} />
          <OverviewTile label="Total Invested" value={formatNumber(portfolioSummary.totalInvested)} />
          <OverviewTile label="Unrealized P/L" value={formatNumber(portfolioSummary.unrealizedProfitLoss)} />
          <OverviewTile label="Realized P/L" value={formatNumber(stockMarket.marketStats.realizedProfitLoss)} />
          <OverviewTile label="Biggest Holding" value={portfolioSummary.biggestHolding?.ticker ?? 'None'} detail={portfolioSummary.biggestHolding ? formatNumber(portfolioSummary.biggestHolding.currentValue) : undefined} />
          <OverviewTile label="Best Performer" value={portfolioSummary.bestPerformer?.ticker ?? 'None'} detail={portfolioSummary.bestPerformer ? `${portfolioSummary.bestPerformer.profitLossPercent.toFixed(1)}%` : undefined} />
          <OverviewTile label="Worst Performer" value={portfolioSummary.worstPerformer?.ticker ?? 'None'} detail={portfolioSummary.worstPerformer ? `${portfolioSummary.worstPerformer.profitLossPercent.toFixed(1)}%` : undefined} />
          <OverviewTile label="Most Traded" value={favoriteStock ?? 'None'} />
        </div>
      </section>

      <div className="stock-layout">
        <div className="stock-main-column">
          <section className="panel stock-section" aria-labelledby="company-list-heading">
            <div className="panel-header-row">
              <div>
                <h2 id="company-list-heading">Company List</h2>
                <p className="panel-subtitle">Prices move every few seconds. A 1% transaction fee applies.</p>
              </div>
            </div>
            <div className="stock-filters">
              <input
                type="search"
                value={query}
                placeholder="Search company, ticker, or sector"
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search stocks"
              />
              <select value={sector} onChange={(event) => setSector(event.target.value)} aria-label="Filter by sector">
                <option value="all">All sectors</option>
                {STOCK_SECTORS.map((stockSector) => (
                  <option key={stockSector} value={stockSector}>{stockSector}</option>
                ))}
              </select>
            </div>
            <div className="stock-card-grid">
              {filteredCompanies.map((company) => (
                <StockCompanyCard
                  key={company.ticker}
                  company={company}
                  position={getStockPosition(stockMarket.portfolio, company.ticker)}
                  onSelect={setSelectedTicker}
                  onBuy={onBuyStock}
                  onSell={onSellStock}
                />
              ))}
            </div>
          </section>

          <PortfolioPanel stockMarket={stockMarket} onSell={onSellStock} />
        </div>

        <aside className="stock-side-column">
          <StockNewsPanel activeNews={stockMarket.activeStockNews} history={stockMarket.stockNewsHistory} />
          <section className="panel stock-section" aria-labelledby="stock-stats-heading">
            <h2 id="stock-stats-heading">Trading Stats</h2>
            <div className="stock-stat-grid">
              <OverviewTile label="Buys" value={formatNumber(stockMarket.marketStats.totalBuys)} />
              <OverviewTile label="Sells" value={formatNumber(stockMarket.marketStats.totalSells)} />
              <OverviewTile label="Best Trade" value={stockMarket.marketStats.bestTrade === null ? 'None' : formatNumber(stockMarket.marketStats.bestTrade)} />
              <OverviewTile label="Worst Trade" value={stockMarket.marketStats.worstTrade === null ? 'None' : formatNumber(stockMarket.marketStats.worstTrade)} />
              <OverviewTile label="News Seen" value={formatNumber(stockMarket.marketStats.marketNewsSeen)} />
              <OverviewTile label="Dividends" value={formatNumber(stockMarket.marketStats.dividendsEarned)} />
            </div>
          </section>
        </aside>
      </div>

      <p className="stock-disclaimer">
        This is a fictional in-game market using fake companies and fake currency. It is not financial advice.
      </p>

      <StockDetailModal
        company={selectedCompany}
        stockMarket={stockMarket}
        onClose={() => setSelectedTicker(null)}
        onBuy={onBuyStock}
        onSell={onSellStock}
      />
    </main>
  );
}
