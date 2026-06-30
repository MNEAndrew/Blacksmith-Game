import { useEffect } from 'react';
import type { NewsEvent } from '../types/news';
import { getEffectSummary, isPositiveNewsEffect } from '../utils/eventModifiers';

interface BreakingNewsModalProps {
  event: NewsEvent | null;
  onClose: (eventId: string) => void;
}

export function BreakingNewsModal({ event, onClose }: BreakingNewsModalProps) {
  useEffect(() => {
    if (!event) return undefined;

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        onClose(event.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [event, onClose]);

  if (!event) return null;

  return (
    <div className="breaking-news-overlay" role="dialog" aria-modal="true" aria-labelledby="breaking-news-title">
      <article className="breaking-news-modal">
        <button
          type="button"
          className="breaking-news-modal__close"
          onClick={() => onClose(event.id)}
          aria-label="Close breaking news"
        >
          X
        </button>
        <p className="breaking-news-modal__label">Breaking News</p>
        <span className={`news-badge news-badge--${event.severity}`}>{event.severity}</span>
        <h2 id="breaking-news-title">{event.headline}</h2>
        <p className="breaking-news-modal__source">{event.source}</p>
        <p>{event.summary}</p>
        <div className="news-effects breaking-news-modal__effects" aria-label="Gameplay effects">
          {event.effects.map((effect, index) => (
            <span
              key={`${event.id}-modal-${effect.type}-${index}`}
              className={`news-effect ${isPositiveNewsEffect(effect) ? 'news-effect--positive' : 'news-effect--negative'}`}
            >
              {getEffectSummary(effect)}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
}
