import type { StockNewsArticle } from '../types/stocks';
import { getAffectedLabel } from '../utils/stockSimulator';

interface StockNewsPanelProps {
  activeNews: StockNewsArticle[];
  history: StockNewsArticle[];
  compact?: boolean;
}

function formatRemaining(article: StockNewsArticle): string {
  const seconds = Math.max(0, Math.ceil((article.expiresAt - Date.now()) / 1000));
  if (seconds <= 0) return 'Expired';
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

export function StockNewsPanel({ activeNews, history, compact = false }: StockNewsPanelProps) {
  const articles = [...activeNews, ...history].slice(0, compact ? 5 : 12);

  return (
    <section className="panel stock-section" aria-labelledby="stock-news-heading">
      <h2 id="stock-news-heading">Market News</h2>
      {articles.length === 0 ? (
        <p className="empty-state">No exchange bulletins yet.</p>
      ) : (
        <div className="stock-news-list">
          {articles.map((article) => (
            <article key={article.id} className={`stock-news-item stock-news-item--${article.sentiment}`}>
              <div className="stock-news-item__topline">
                <span>{article.sentiment}</span>
                <strong>{getAffectedLabel(article)}</strong>
                <em>{formatRemaining(article)}</em>
              </div>
              <h3>{article.headline}</h3>
              <p>{article.summary}</p>
              {!compact && <small>Expected impact: {article.priceImpactPercent > 0 ? '+' : ''}{article.priceImpactPercent.toFixed(1)}%</small>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
