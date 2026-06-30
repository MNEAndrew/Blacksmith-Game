import { useEffect, useMemo, useState } from 'react';
import { ResourceBar } from './ResourceBar';
import { NewsCard } from './NewsCard';
import { StockNewsPanel } from './StockNewsPanel';
import { NEWS_EVENT_INTERVAL_MS } from '../data/newsEvents';
import type { GameModifiers, GameState } from '../types/game';
import { getActiveEventModifiers, getEffectSummary, isPositiveNewsEffect } from '../utils/eventModifiers';

interface NewsPanelProps {
  state: GameState;
  modifiers: GameModifiers;
}

const SPONSORED_NOTICES = [
  'Sponsored: Try ThunderPick 9000. Definitely not cursed, according to the seller.',
  'Paid notice: Moonfall Tools now offers handles pre-splintered for authenticity.',
  'Guild memo: A clean apron increases bargaining power by at least one confident nod.',
  'Rumor desk: The left anvil rings louder during profitable weather.',
];

function formatNextEvent(lastGeneratedAt: number | null): string {
  if (lastGeneratedAt === null) return 'Calibrating presses';
  const nextAt = lastGeneratedAt + NEWS_EVENT_INTERVAL_MS;
  const seconds = Math.max(0, Math.ceil((nextAt - Date.now()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes > 0) return `${minutes}m ${remainder}s`;
  return `${remainder}s`;
}

export function NewsPanel({ state, modifiers }: NewsPanelProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeEvents = state.news.activeEvents.filter((event) => event.expiresAt > now);
  const expiredEvents = state.news.newsHistory;
  const latestArticles = [...activeEvents, ...expiredEvents]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8);
  const activeEventModifiers = useMemo(() => getActiveEventModifiers(activeEvents), [activeEvents]);
  const uniqueEffectSummaries = Array.from(new Set(modifiers.eventEffectSummaries));

  return (
    <main className="news-page">
      <ResourceBar state={state} />

      <section className="news-hero">
        <div>
          <p className="news-hero__eyebrow">The Bellows Bulletin</p>
          <h2>News</h2>
          <p>Fictional market reports, rumors, notices, and ads that bend the Forge Rush economy.</p>
        </div>
        <div className="news-hero__ticker" aria-label="News timing">
          <span>Active events: {activeEvents.length}</span>
          <span>Next press run: {formatNextEvent(state.news.lastNewsGeneratedAt)}</span>
        </div>
      </section>

      <section className="news-layout">
        <div className="news-main-column">
          <section className="panel news-section" aria-labelledby="active-news-heading">
            <div className="panel-header-row">
              <div>
                <h2 id="active-news-heading">Breaking / Active Events</h2>
                <p className="panel-subtitle">Temporary stories currently affecting the forge economy.</p>
              </div>
            </div>
            {activeEvents.length > 0 ? (
              <div className="news-card-grid">
                {activeEvents.map((event) => (
                  <NewsCard key={event.id} event={event} now={now} />
                ))}
              </div>
            ) : (
              <p className="empty-state">The presses are quiet. A new fictional event will arrive soon.</p>
            )}
          </section>

          <section className="panel news-section" aria-labelledby="latest-news-heading">
            <h2 id="latest-news-heading">Latest Articles</h2>
            <p className="panel-subtitle">Recent headlines from forge districts, market criers, and suspicious notice boards.</p>
            {latestArticles.length > 0 ? (
              <div className="news-card-grid news-card-grid--compact">
                {latestArticles.map((event) => (
                  <NewsCard key={`latest-${event.id}`} event={event} now={now} compact />
                ))}
              </div>
            ) : (
              <p className="empty-state">No articles have been printed yet.</p>
            )}
          </section>

          <section className="panel news-section" aria-labelledby="history-news-heading">
            <h2 id="history-news-heading">News History</h2>
            <p className="panel-subtitle">Expired events are archived here after their effects end.</p>
            {expiredEvents.length > 0 ? (
              <div className="news-history-list">
                {expiredEvents.slice(0, 12).map((event) => (
                  <NewsCard key={`history-${event.id}`} event={event} now={now} compact />
                ))}
              </div>
            ) : (
              <p className="empty-state">Expired articles will collect here.</p>
            )}
          </section>
        </div>

        <aside className="news-side-column">
          <section className="panel news-section" aria-labelledby="effects-news-heading">
            <h2 id="effects-news-heading">Market Effects</h2>
            <p className="panel-subtitle">Current buffs and debuffs applied by active stories.</p>
            {uniqueEffectSummaries.length > 0 ? (
              <div className="market-effect-list">
                {uniqueEffectSummaries.map((summary) => {
                  const effect = activeEvents
                    .flatMap((event) => event.effects)
                    .find((candidate) => getEffectSummary(candidate) === summary);
                  return (
                    <span
                      key={summary}
                      className={`news-effect ${effect && isPositiveNewsEffect(effect) ? 'news-effect--positive' : 'news-effect--negative'}`}
                    >
                      {summary}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="empty-state">No active modifiers.</p>
            )}
          </section>

          <section className="panel news-section" aria-labelledby="reports-news-heading">
            <h2 id="reports-news-heading">Market Reports</h2>
            <div className="market-report-grid">
              <div>
                <span>Positive effects</span>
                <strong>{activeEventModifiers.positiveEffectCount}</strong>
              </div>
              <div>
                <span>Negative effects</span>
                <strong>{activeEventModifiers.negativeEffectCount}</strong>
              </div>
              <div>
                <span>Upgrade cost pulse</span>
                <strong>{Math.round((activeEventModifiers.upgradeCostMultiplier - 1) * 100)}%</strong>
              </div>
              <div>
                <span>Reputation pulse</span>
                <strong>{Math.round((activeEventModifiers.reputationGainMultiplier - 1) * 100)}%</strong>
              </div>
            </div>
          </section>

          <section className="panel news-section" aria-labelledby="ads-news-heading">
            <h2 id="ads-news-heading">Sponsored Ads / Propaganda</h2>
            <div className="notice-stack">
              {SPONSORED_NOTICES.map((notice) => (
                <p key={notice} className="news-notice">{notice}</p>
              ))}
            </div>
          </section>

          <StockNewsPanel
            activeNews={state.stockMarket.activeStockNews}
            history={state.stockMarket.stockNewsHistory}
            compact
          />
        </aside>
      </section>
    </main>
  );
}
