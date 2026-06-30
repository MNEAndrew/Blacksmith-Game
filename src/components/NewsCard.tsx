import type { NewsEvent } from '../types/news';
import { getEffectSummary, isPositiveNewsEffect } from '../utils/eventModifiers';

interface NewsCardProps {
  event: NewsEvent;
  now: number;
  compact?: boolean;
}

function formatTimeRemaining(event: NewsEvent, now: number): string {
  const seconds = Math.max(0, Math.ceil((event.expiresAt - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

function formatCreatedAt(value: number): string {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function NewsCard({ event, now, compact = false }: NewsCardProps) {
  const active = event.expiresAt > now;

  return (
    <article className={`news-card news-card--${event.type} ${active ? 'news-card--active' : 'news-card--expired'}`}>
      <div className="news-card__topline">
        <span className={`news-badge news-badge--${event.severity}`}>{event.severity}</span>
        {event.isBreaking && <span className="breaking-badge">Breaking</span>}
        <span className="news-card__source">{event.source}</span>
      </div>

      <h3>{event.headline}</h3>
      <p className="news-card__summary">{event.summary}</p>
      {!compact && <p className="news-card__body">{event.body}</p>}

      <div className="news-effects" aria-label="Event effects">
        {event.effects.map((effect, index) => (
          <span
            key={`${event.id}-${effect.type}-${index}`}
            className={`news-effect ${isPositiveNewsEffect(effect) ? 'news-effect--positive' : 'news-effect--negative'}`}
          >
            {getEffectSummary(effect)}
          </span>
        ))}
      </div>

      <footer className="news-card__footer">
        <span>{active ? `${formatTimeRemaining(event, now)} remaining` : 'Expired'}</span>
        <span>{formatCreatedAt(event.createdAt)}</span>
      </footer>
    </article>
  );
}
