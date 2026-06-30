import type { CraftableCategory, MaterialKey } from './game';

export type NewsEventType =
  | 'war'
  | 'disaster'
  | 'market'
  | 'industry'
  | 'festival'
  | 'scandal'
  | 'ad'
  | 'propaganda'
  | 'rumor';

export type NewsSeverity = 'minor' | 'moderate' | 'major' | 'legendary';

export type NewsEffectType =
  | 'itemSellValueMultiplier'
  | 'categorySellValueMultiplier'
  | 'resourceGainMultiplier'
  | 'autoProductionMultiplier'
  | 'craftSpeedMultiplier'
  | 'reputationGainMultiplier'
  | 'upgradeCostMultiplier'
  | 'specificItemValueMultiplier'
  | 'specificResourceMultiplier';

export interface EventEffect {
  type: NewsEffectType;
  multiplier: number;
  category?: CraftableCategory;
  resource?: MaterialKey;
  itemId?: string;
  label: string;
}

export interface NewsEvent {
  id: string;
  type: NewsEventType;
  headline: string;
  source: string;
  summary: string;
  body: string;
  severity: NewsSeverity;
  durationSeconds: number;
  createdAt: number;
  expiresAt: number;
  effects: EventEffect[];
  isBreaking: boolean;
  hasBeenSeen: boolean;
}

export interface NewsState {
  activeEvents: NewsEvent[];
  newsHistory: NewsEvent[];
  seenBreakingEventIds: string[];
  lastNewsGeneratedAt: number | null;
  totalNewsEventsSeen: number;
}

export const INITIAL_NEWS_STATE: NewsState = {
  activeEvents: [],
  newsHistory: [],
  seenBreakingEventIds: [],
  lastNewsGeneratedAt: null,
  totalNewsEventsSeen: 0,
};
