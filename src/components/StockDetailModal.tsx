import { useState } from 'react';
import { StockSparkline } from './StockSparkline';
import type { StockCompany, StockMarketState } from '../types/stocks';
import { getStockPosition } from '../utils/portfolioCalculations';
import { getCompanyChangePercent } from '../utils/stockSimulator';
import { formatNumber } from '../utils/gameLogic';

interface StockDetailModalProps {
  company: StockCompany | null;
  stockMarket: StockMarketState;
  onClose: () => void;
  onBuy: (ticker: string, shares: number) => void;
  onSell: (ticker: string, shares: number | 'all') => void;
}

const QUICK_AMOUNTS = [1, 5, 10, 25, 100] as const;

export function StockDetailModal({ company, stockMarket, onClose, onBuy, onSell }: StockDetailModalProps) {
  const [customAmount, setCustomAmount] = useState(1);

  if (!company) return null;

  const position = getStockPosition(stockMarket.portfolio, company.ticker);
  const change = getCompanyChangePercent(company);
  const positive = change >= 0;
  const recentNews = [...stockMarket.activeStockNews, ...stockMarket.stockNewsHistory]
    .filter((article) =>
      article.impactType === 'market_wide' ||
      article.affectedTickers.includes(company.ticker) ||
      article.affectedSectors.includes(company.sector),
    )
    .slice(0, 5);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="stock-detail-title">
      <article className="stock-detail-modal">
        <button type="button" className="breaking-news-modal__close" onClick={onClose} aria-label="Close stock detail">X</button>
        <div className="stock-detail-modal__header">
          <div>
            <span className="stock-detail-modal__ticker">{company.ticker}</span>
            <h2 id="stock-detail-title">{company.name}</h2>
            <p>{company.description}</p>
          </div>
          <div>
            <strong>{formatNumber(company.currentPrice)} coins</strong>
            <span className={positive ? 'stock-change--up' : 'stock-change--down'}>
              {positive ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        </div>

        <StockSparkline values={company.priceHistory} positive={positive} large />

        <div className="stock-detail-grid">
          <div><span>Sector</span><strong>{company.sector}</strong></div>
          <div><span>Risk</span><strong>{company.riskLevel}</strong></div>
          <div><span>Market cap</span><strong>{company.marketCapTier}</strong></div>
          <div><span>Shares owned</span><strong>{position?.shares ?? 0}</strong></div>
          <div><span>Average cost</span><strong>{position ? position.averagePurchasePrice.toFixed(2) : '-'}</strong></div>
        </div>

        <div className="stock-trade-controls">
          <div>
            <span>Buy</span>
            <div className="stock-button-row">
              {QUICK_AMOUNTS.map((amount) => (
                <button key={`buy-${amount}`} type="button" className="stock-mini-btn" onClick={() => onBuy(company.ticker, amount)}>
                  {amount}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span>Sell</span>
            <div className="stock-button-row">
              {QUICK_AMOUNTS.map((amount) => (
                <button key={`sell-${amount}`} type="button" className="stock-mini-btn stock-mini-btn--sell" onClick={() => onSell(company.ticker, amount)} disabled={!position || position.shares < amount}>
                  {amount}
                </button>
              ))}
              <button type="button" className="stock-mini-btn stock-mini-btn--sell" onClick={() => onSell(company.ticker, 'all')} disabled={!position}>
                All
              </button>
            </div>
          </div>
          <label className="stock-custom-input">
            Custom shares
            <input
              type="number"
              min="1"
              value={customAmount}
              onChange={(event) => setCustomAmount(Math.max(1, Math.floor(Number(event.target.value) || 1)))}
            />
          </label>
          <div className="stock-button-row">
            <button type="button" className="craft-btn" onClick={() => onBuy(company.ticker, customAmount)}>Buy Custom</button>
            <button type="button" className="secondary-btn" onClick={() => onSell(company.ticker, customAmount)} disabled={!position || position.shares < customAmount}>Sell Custom</button>
          </div>
        </div>

        <section className="stock-detail-news">
          <h3>Recent News</h3>
          {recentNews.length === 0 ? (
            <p>No recent company-specific bulletins.</p>
          ) : (
            recentNews.map((article) => (
              <p key={article.id}><strong>{article.sentiment}:</strong> {article.headline}</p>
            ))
          )}
        </section>
      </article>
    </div>
  );
}
