import type { StockMarketState } from '../types/stocks';
import { calculatePortfolioSummary } from '../utils/portfolioCalculations';
import { formatNumber } from '../utils/gameLogic';

interface PortfolioPanelProps {
  stockMarket: StockMarketState;
  onSell: (ticker: string, shares: number | 'all') => void;
}

export function PortfolioPanel({ stockMarket, onSell }: PortfolioPanelProps) {
  const summary = calculatePortfolioSummary(stockMarket);

  return (
    <section className="panel stock-section" aria-labelledby="portfolio-heading">
      <h2 id="portfolio-heading">Portfolio Holdings</h2>
      {summary.holdings.length === 0 ? (
        <p className="empty-state">No shares owned yet.</p>
      ) : (
        <div className="portfolio-list">
          {summary.holdings.map((holding) => (
            <div key={holding.ticker} className="portfolio-row">
              <div>
                <strong>{holding.ticker}</strong>
                <span>{holding.shares} shares @ {holding.averagePurchasePrice.toFixed(2)}</span>
              </div>
              <div>
                <span>{formatNumber(holding.currentValue)} coins</span>
                <strong className={holding.profitLoss >= 0 ? 'stock-change--up' : 'stock-change--down'}>
                  {holding.profitLoss >= 0 ? '+' : ''}{formatNumber(holding.profitLoss)}
                </strong>
              </div>
              <button type="button" className="stock-mini-btn stock-mini-btn--sell" onClick={() => onSell(holding.ticker, 'all')}>
                Sell All
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
