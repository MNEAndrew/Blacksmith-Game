import { useEffect } from 'react';
import type { StockNewsArticle } from '../types/stocks';
import { getAffectedLabel } from '../utils/stockSimulator';

interface MarketBreakingNewsModalProps {
  article: StockNewsArticle | null;
  onClose: (articleId: string) => void;
}

export function MarketBreakingNewsModal({ article, onClose }: MarketBreakingNewsModalProps) {
  useEffect(() => {
    if (!article) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(article.id);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [article, onClose]);

  if (!article) return null;

  return (
    <div className="breaking-news-overlay" role="dialog" aria-modal="true" aria-labelledby="market-breaking-title">
      <article className={`breaking-news-modal market-breaking-modal market-breaking-modal--${article.sentiment}`}>
        <button
          type="button"
          className="breaking-news-modal__close"
          onClick={() => onClose(article.id)}
          aria-label="Close market breaking news"
        >
          X
        </button>
        <p className="breaking-news-modal__label">Market Breaking News</p>
        <span className={`stock-news-chip stock-news-chip--${article.sentiment}`}>{article.sentiment}</span>
        <h2 id="market-breaking-title">{article.headline}</h2>
        <p className="breaking-news-modal__source">{article.source}</p>
        <p>{article.summary}</p>
        <div className="market-breaking-modal__impact">
          <span>Affected: {getAffectedLabel(article)}</span>
          <strong>Expected impact: {article.priceImpactPercent > 0 ? '+' : ''}{article.priceImpactPercent.toFixed(1)}%</strong>
        </div>
      </article>
    </div>
  );
}
