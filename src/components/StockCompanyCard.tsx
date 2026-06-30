import { StockSparkline } from './StockSparkline';
import type { StockCompany, StockPosition } from '../types/stocks';
import { getCompanyChangePercent } from '../utils/stockSimulator';
import { formatNumber } from '../utils/gameLogic';

interface StockCompanyCardProps {
  company: StockCompany;
  position: StockPosition | null;
  onSelect: (ticker: string) => void;
  onBuy: (ticker: string, shares: number) => void;
  onSell: (ticker: string, shares: number | 'all') => void;
}

export function StockCompanyCard({ company, position, onSelect, onBuy, onSell }: StockCompanyCardProps) {
  const change = getCompanyChangePercent(company);
  const positive = change >= 0;

  return (
    <article className="stock-card">
      <button type="button" className="stock-card__main" onClick={() => onSelect(company.ticker)}>
        <div className="stock-card__header">
          <div>
            <strong>{company.ticker}</strong>
            <span>{company.name}</span>
          </div>
          <span className={`stock-risk stock-risk--${company.riskLevel}`}>{company.riskLevel}</span>
        </div>
        <div className="stock-card__price-row">
          <span>{formatNumber(company.currentPrice)} coins</span>
          <strong className={positive ? 'stock-change--up' : 'stock-change--down'}>
            {positive ? '+' : ''}{change.toFixed(2)}%
          </strong>
        </div>
        <StockSparkline values={company.priceHistory} positive={positive} />
        <div className="stock-card__meta">
          <span>{company.sector}</span>
          {position && <span>{position.shares} owned @ {company.currentPrice.toFixed(2)}</span>}
        </div>
      </button>
      <div className="stock-card__actions">
        <button type="button" className="stock-mini-btn" onClick={() => onBuy(company.ticker, 1)}>Buy 1</button>
        <button type="button" className="stock-mini-btn" onClick={() => onBuy(company.ticker, 5)}>Buy 5</button>
        {position && (
          <button type="button" className="stock-mini-btn stock-mini-btn--sell" onClick={() => onSell(company.ticker, 'all')}>
            Sell All
          </button>
        )}
      </div>
    </article>
  );
}
