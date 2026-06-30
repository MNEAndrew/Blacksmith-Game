import type {
  CraftableCategory,
  CraftableItem,
  GameState,
  MaterialKey,
} from '../types/game';
import {
  CRAFTABLE_CATEGORY_LABELS,
  MATERIAL_LABELS,
} from '../types/game';
import type { EventEffect, NewsEvent } from '../types/news';

export interface EventModifierState {
  sellMultiplier: number;
  categorySellMultipliers: Record<CraftableCategory, number>;
  specificItemValueMultipliers: Record<string, number>;
  resourceGainMultipliers: Record<MaterialKey, number>;
  autoProductionMultipliers: Record<MaterialKey, number>;
  craftSpeedMultiplier: number;
  categoryCraftSpeedMultipliers: Record<CraftableCategory, number>;
  specificItemCraftSpeedMultipliers: Record<string, number>;
  reputationGainMultiplier: number;
  upgradeCostMultiplier: number;
  effectSummaries: string[];
  positiveEffectCount: number;
  negativeEffectCount: number;
}

type ModifierType =
  | 'itemSellValueMultiplier'
  | 'resourceGainMultiplier'
  | 'autoProductionMultiplier'
  | 'craftSpeedMultiplier'
  | 'reputationGainMultiplier'
  | 'upgradeCostMultiplier';

interface ModifierContext {
  item?: CraftableItem;
  category?: CraftableCategory;
  resource?: MaterialKey;
  source?: 'manual' | 'auto';
}

const CATEGORY_ORDER: CraftableCategory[] = ['tools', 'melee', 'ranged', 'armor', 'accessories'];

function createCategoryRecord(value = 1): Record<CraftableCategory, number> {
  return Object.fromEntries(CATEGORY_ORDER.map((category) => [category, value])) as Record<CraftableCategory, number>;
}

function createMaterialRecord(value = 1): Record<MaterialKey, number> {
  const materials: MaterialKey[] = ['wood', 'stone', 'copper', 'iron', 'gold', 'emerald', 'diamond', 'ruby', 'mithril'];
  return Object.fromEntries(materials.map((material) => [material, value])) as Record<MaterialKey, number>;
}

export function getActiveNewsEvents(state: GameState, now = Date.now()): NewsEvent[] {
  return state.news.activeEvents.filter((event) => event.expiresAt > now);
}

export function isPositiveNewsEffect(effect: EventEffect): boolean {
  if (effect.type === 'upgradeCostMultiplier') return effect.multiplier < 1;
  return effect.multiplier > 1;
}

export function getEventImpactScore(event: NewsEvent): number {
  const severityWeight = {
    minor: 1,
    moderate: 1.25,
    major: 1.6,
    legendary: 2,
  }[event.severity];

  return event.effects.reduce((score, effect) => score + Math.abs(effect.multiplier - 1) * severityWeight, 0);
}

export function getEffectSummary(effect: EventEffect): string {
  const percent = Math.round(Math.abs(effect.multiplier - 1) * 100);
  const direction = isPositiveNewsEffect(effect) ? '+' : '-';

  if (effect.type === 'categorySellValueMultiplier' && effect.category) {
    return `${CRAFTABLE_CATEGORY_LABELS[effect.category]} value ${direction}${percent}%`;
  }
  if (effect.type === 'specificResourceMultiplier' && effect.resource) {
    return `${MATERIAL_LABELS[effect.resource]} gain ${direction}${percent}%`;
  }
  if (effect.type === 'resourceGainMultiplier' && effect.resource) {
    return `${MATERIAL_LABELS[effect.resource]} gathering ${direction}${percent}%`;
  }
  if (effect.type === 'autoProductionMultiplier' && effect.resource) {
    return `Auto ${MATERIAL_LABELS[effect.resource].toLowerCase()} ${direction}${percent}%`;
  }
  if (effect.type === 'craftSpeedMultiplier') {
    if (effect.category) return `${CRAFTABLE_CATEGORY_LABELS[effect.category]} crafting ${direction}${percent}%`;
    return `Crafting speed ${direction}${percent}%`;
  }
  if (effect.type === 'reputationGainMultiplier') {
    return `Reputation gains ${direction}${percent}%`;
  }
  if (effect.type === 'upgradeCostMultiplier') {
    return `Upgrade costs ${direction}${percent}%`;
  }
  if (effect.type === 'specificItemValueMultiplier') {
    return `${effect.label}`;
  }

  return effect.label;
}

export function getActiveEventModifiers(activeEvents: NewsEvent[]): EventModifierState {
  const modifiers: EventModifierState = {
    sellMultiplier: 1,
    categorySellMultipliers: createCategoryRecord(1),
    specificItemValueMultipliers: {},
    resourceGainMultipliers: createMaterialRecord(1),
    autoProductionMultipliers: createMaterialRecord(1),
    craftSpeedMultiplier: 1,
    categoryCraftSpeedMultipliers: createCategoryRecord(1),
    specificItemCraftSpeedMultipliers: {},
    reputationGainMultiplier: 1,
    upgradeCostMultiplier: 1,
    effectSummaries: [],
    positiveEffectCount: 0,
    negativeEffectCount: 0,
  };

  for (const event of activeEvents) {
    for (const effect of event.effects) {
      modifiers.effectSummaries.push(getEffectSummary(effect));
      if (isPositiveNewsEffect(effect)) modifiers.positiveEffectCount += 1;
      else modifiers.negativeEffectCount += 1;

      switch (effect.type) {
        case 'itemSellValueMultiplier':
          modifiers.sellMultiplier *= effect.multiplier;
          break;
        case 'categorySellValueMultiplier':
          if (effect.category) modifiers.categorySellMultipliers[effect.category] *= effect.multiplier;
          break;
        case 'specificItemValueMultiplier':
          if (effect.itemId) {
            modifiers.specificItemValueMultipliers[effect.itemId] =
              (modifiers.specificItemValueMultipliers[effect.itemId] ?? 1) * effect.multiplier;
          }
          break;
        case 'resourceGainMultiplier':
        case 'specificResourceMultiplier':
          if (effect.resource) modifiers.resourceGainMultipliers[effect.resource] *= effect.multiplier;
          break;
        case 'autoProductionMultiplier':
          if (effect.resource) modifiers.autoProductionMultipliers[effect.resource] *= effect.multiplier;
          break;
        case 'craftSpeedMultiplier':
          if (effect.itemId) {
            modifiers.specificItemCraftSpeedMultipliers[effect.itemId] =
              (modifiers.specificItemCraftSpeedMultipliers[effect.itemId] ?? 1) * effect.multiplier;
          } else if (effect.category) {
            modifiers.categoryCraftSpeedMultipliers[effect.category] *= effect.multiplier;
          } else {
            modifiers.craftSpeedMultiplier *= effect.multiplier;
          }
          break;
        case 'reputationGainMultiplier':
          modifiers.reputationGainMultiplier *= effect.multiplier;
          break;
        case 'upgradeCostMultiplier':
          modifiers.upgradeCostMultiplier *= effect.multiplier;
          break;
      }
    }
  }

  return modifiers;
}

export function applyEventModifiers(
  baseValue: number,
  modifierType: ModifierType,
  context: ModifierContext,
  activeEvents: NewsEvent[],
): number {
  const modifiers = getActiveEventModifiers(activeEvents);
  let multiplier = 1;

  if (modifierType === 'itemSellValueMultiplier') {
    const item = context.item;
    multiplier *= modifiers.sellMultiplier;
    if (item) {
      multiplier *= modifiers.categorySellMultipliers[item.category];
      multiplier *= modifiers.specificItemValueMultipliers[item.id] ?? 1;
    } else if (context.category) {
      multiplier *= modifiers.categorySellMultipliers[context.category];
    }
  }

  if (modifierType === 'resourceGainMultiplier' && context.resource) {
    multiplier *= modifiers.resourceGainMultipliers[context.resource];
  }

  if (modifierType === 'autoProductionMultiplier' && context.resource) {
    multiplier *= modifiers.resourceGainMultipliers[context.resource];
    multiplier *= modifiers.autoProductionMultipliers[context.resource];
  }

  if (modifierType === 'craftSpeedMultiplier') {
    multiplier *= modifiers.craftSpeedMultiplier;
    if (context.item) {
      multiplier *= modifiers.categoryCraftSpeedMultipliers[context.item.category];
      multiplier *= modifiers.specificItemCraftSpeedMultipliers[context.item.id] ?? 1;
    } else if (context.category) {
      multiplier *= modifiers.categoryCraftSpeedMultipliers[context.category];
    }
  }

  if (modifierType === 'reputationGainMultiplier') {
    multiplier *= modifiers.reputationGainMultiplier;
  }

  if (modifierType === 'upgradeCostMultiplier') {
    multiplier *= modifiers.upgradeCostMultiplier;
  }

  return baseValue * multiplier;
}

export function calculateSellValue(item: CraftableItem, baseSellMultiplier: number, activeEvents: NewsEvent[]): number {
  return Math.floor(applyEventModifiers(
    item.coinValue * baseSellMultiplier,
    'itemSellValueMultiplier',
    { item },
    activeEvents,
  ));
}

export function calculateResourceGain(
  baseValue: number,
  resource: MaterialKey,
  source: 'manual' | 'auto',
  activeEvents: NewsEvent[],
): number {
  return applyEventModifiers(
    baseValue,
    source === 'auto' ? 'autoProductionMultiplier' : 'resourceGainMultiplier',
    { resource, source },
    activeEvents,
  );
}
