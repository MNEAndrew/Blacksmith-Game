import { STOCK_SECTORS } from '../data/stockCompanies';
import type { StockCompany, StockNewsArticle, StockNewsImpactType, StockNewsSentiment } from '../types/stocks';

function pick<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function sample<T>(values: T[], count: number): T[] {
  const copy = [...values];
  const result: T[] = [];
  while (result.length < count && copy.length > 0) {
    result.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return result;
}

function randomId(now: number): string {
  return `stock-news-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function chooseSentiment(): StockNewsSentiment {
  const roll = Math.random();
  if (roll < 0.6) return 'negative';
  if (roll < 0.85) return 'positive';
  return 'neutral';
}

function chooseImpactType(): StockNewsImpactType {
  const roll = Math.random();
  if (roll < 0.45) return 'single_stock';
  if (roll < 0.7) return 'sector';
  if (roll < 0.9) return 'multi_stock';
  return 'market_wide';
}

function getImpactPercent(sentiment: StockNewsSentiment): number {
  if (sentiment === 'positive') return Math.round((5 + Math.random() * 11) * 100) / 100;
  if (sentiment === 'negative') return -Math.round((6 + Math.random() * 14) * 100) / 100;
  return Math.round((2 + Math.random() * 6) * 100) / 100;
}

function getStockHeadline(sentiment: StockNewsSentiment, company: StockCompany): { headline: string; summary: string; body: string } {
  if (sentiment === 'positive') {
    return {
      headline: `${company.name} announces surprisingly popular expansion`,
      summary: `${company.ticker} traders cheer a fresh growth report.`,
      body: `${company.name} says demand is stronger than expected. Market criers are calling it a clean win, though one analyst described the report as "almost too tidy."`,
    };
  }

  if (sentiment === 'negative') {
    return {
      headline: `${company.name} stumbles after costly operating mishap`,
      summary: `${company.ticker} faces selling pressure after a rough company update.`,
      body: `${company.name} insists the issue is temporary, but investors are not waiting for the ink to dry before lowering bids.`,
    };
  }

  return {
    headline: `Analysts split on ${company.name} outlook`,
    summary: `${company.ticker} volatility rises as market desks disagree.`,
    body: `Some brokers see a rebound, others see a trapdoor. The only consensus is that the next few ticks may wobble.`,
  };
}

function getSectorHeadline(sentiment: StockNewsSentiment, sector: string): { headline: string; summary: string; body: string } {
  if (sentiment === 'positive') {
    return {
      headline: `${sector} sector rallies after strong realm-wide demand`,
      summary: `${sector} companies receive a broad bid from optimistic traders.`,
      body: `Market boards report busier counters and brighter forecasts across the ${sector.toLowerCase()} sector.`,
    };
  }

  if (sentiment === 'negative') {
    return {
      headline: `${sector} sector falls as costs and rumors spread`,
      summary: `${sector} stocks are under pressure after a gloomy trade bulletin.`,
      body: `Brokers are reducing marks across the ${sector.toLowerCase()} names while merchants argue over whether the panic is sensible.`,
    };
  }

  return {
    headline: `Market analysts split on ${sector} sector`,
    summary: `${sector} names become more volatile as forecasts diverge.`,
    body: `One desk sees a rally. Another sees a mess. Both charged a consulting fee.`,
  };
}

function getMarketHeadline(sentiment: StockNewsSentiment): { headline: string; summary: string; body: string } {
  if (sentiment === 'positive') {
    return {
      headline: 'Exchange boards bounce after upbeat trade reports',
      summary: 'The whole fake market catches a brief wave of optimism.',
      body: 'A bundle of cheerful shipping, retail, and service reports has traders raising bids across the board.',
    };
  }

  if (sentiment === 'negative') {
    return {
      headline: 'Realm-wide risk scare rattles the exchange',
      summary: 'Most tickers sag after a cautious bulletin from market scribes.',
      body: 'No one agrees what started the selling, which has not stopped anyone from selling first and explaining later.',
    };
  }

  return {
    headline: 'Exchange opens choppy as traders wait for clearer signals',
    summary: 'Market-wide volatility rises without a clear direction.',
    body: 'The trading floor is loud, confused, and apparently proud of both facts.',
  };
}

export function generateStockNews(companies: StockCompany[], now = Date.now()): StockNewsArticle {
  const sentiment = chooseSentiment();
  const impactType = chooseImpactType();
  const priceImpactPercent = getImpactPercent(sentiment);
  const durationSeconds = sentiment === 'neutral' ? 75 : 100 + Math.floor(Math.random() * 80);
  let affectedTickers: string[] = [];
  let affectedSectors: StockNewsArticle['affectedSectors'] = [];
  let copy: { headline: string; summary: string; body: string };

  if (impactType === 'single_stock') {
    const company = pick(companies);
    affectedTickers = [company.ticker];
    copy = getStockHeadline(sentiment, company);
  } else if (impactType === 'sector') {
    const sector = pick(STOCK_SECTORS);
    affectedSectors = [sector];
    copy = getSectorHeadline(sentiment, sector);
  } else if (impactType === 'multi_stock') {
    const selected = sample(companies, 2 + Math.floor(Math.random() * 3));
    affectedTickers = selected.map((company) => company.ticker);
    copy = sentiment === 'negative'
      ? {
          headline: `${affectedTickers.join(', ')} slide after connected supply concern`,
          summary: 'Several unrelated companies are somehow worried about the same problem.',
          body: 'Market desks say the affected companies share vendors, routes, or simply bad luck.',
        }
      : {
          headline: `${affectedTickers.join(', ')} jump on cross-market optimism`,
          summary: 'A cluster of tickers catches a broad wave of buying.',
          body: 'The rally may be justified, exaggerated, or both before lunch.',
        };
  } else {
    copy = getMarketHeadline(sentiment);
  }

  return {
    id: randomId(now),
    headline: copy.headline,
    source: 'Forge Exchange Wire',
    body: copy.body,
    summary: copy.summary,
    sentiment,
    impactType,
    affectedTickers,
    affectedSectors,
    priceImpactPercent,
    volatilityImpact: sentiment === 'neutral' ? 0.75 : 0.35,
    durationSeconds,
    createdAt: now,
    expiresAt: now + durationSeconds * 1000,
    isBreaking: sentiment !== 'neutral' || Math.abs(priceImpactPercent) >= 8,
    hasBeenSeen: false,
  };
}
