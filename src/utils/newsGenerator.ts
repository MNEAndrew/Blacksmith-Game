import { CRAFTABLE_ITEMS } from '../data/items';
import {
  FICTIONAL_COMPANIES,
  FICTIONAL_DISASTERS,
  FICTIONAL_GUILDS,
  FICTIONAL_KINGDOMS,
  FICTIONAL_MARKETS,
  FICTIONAL_NEWSPAPERS,
  FICTIONAL_PRODUCTS,
  NEWS_CATEGORIES,
  NEWS_RESOURCES,
} from '../data/newsEvents';
import type { CraftableCategory, MaterialKey } from '../types/game';
import { CRAFTABLE_CATEGORY_LABELS, MATERIAL_LABELS } from '../types/game';
import type { EventEffect, NewsEvent, NewsEventType, NewsSeverity } from '../types/news';

type NewsTemplate = (now: number) => NewsEvent;

const SEVERITY_DURATION_SECONDS: Record<NewsSeverity, number> = {
  minor: 120,
  moderate: 180,
  major: 240,
  legendary: 360,
};

function pick<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function randomId(type: NewsEventType, now: number): string {
  return `${type}-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function withDuration(
  type: NewsEventType,
  severity: NewsSeverity,
  now: number,
  event: Omit<NewsEvent, 'id' | 'type' | 'severity' | 'durationSeconds' | 'createdAt' | 'expiresAt' | 'hasBeenSeen'>,
): NewsEvent {
  const durationSeconds = SEVERITY_DURATION_SECONDS[severity];

  return {
    ...event,
    id: randomId(type, now),
    type,
    severity,
    durationSeconds,
    createdAt: now,
    expiresAt: now + durationSeconds * 1000,
    hasBeenSeen: false,
  };
}

function categoryLabel(category: CraftableCategory): string {
  return CRAFTABLE_CATEGORY_LABELS[category].toLowerCase();
}

function resourceLabel(resource: MaterialKey): string {
  return MATERIAL_LABELS[resource].toLowerCase();
}

function effect(
  type: EventEffect['type'],
  multiplier: number,
  label: string,
  extra: Partial<EventEffect> = {},
): EventEffect {
  return { type, multiplier, label, ...extra };
}

const templates: NewsTemplate[] = [
  (now) => {
    const aggressor = pick(FICTIONAL_KINGDOMS);
    const defender = pick(FICTIONAL_KINGDOMS.filter((kingdom) => kingdom !== aggressor));
    const source = pick(FICTIONAL_NEWSPAPERS);
    return withDuration('war', 'major', now, {
      headline: `${aggressor} and ${defender} Sabers Rattle at Dawn`,
      source,
      summary: 'Quartermasters are buying every battlefield-ready blade they can find.',
      body: `Couriers from ${aggressor} and ${defender} report a dramatic increase in saber-polishing, shield-counting, and very serious map pointing. Forge brokers expect weapon demand to stay hot until the shouting cools.`,
      effects: [
        effect('categorySellValueMultiplier', 1.5, 'Melee and ranged weapons sell for 50% more.', { category: 'melee' }),
        effect('categorySellValueMultiplier', 1.35, 'Ranged weapons sell for 35% more.', { category: 'ranged' }),
      ],
      isBreaking: true,
    });
  },
  (now) => {
    const disaster = pick(FICTIONAL_DISASTERS);
    return withDuration('disaster', 'major', now, {
      headline: `${disaster} Sweeps Through Timber Roads`,
      source: pick(FICTIONAL_NEWSPAPERS),
      summary: 'Wood deliveries are still moving, but every cart is arriving late and dramatic.',
      body: `The western timber roads are covered in smoke, mud, and contradictory safety posters. Lumber crews remain active, though automated wood stacking has slowed sharply.`,
      effects: [
        effect('autoProductionMultiplier', 0.5, 'Auto wood production reduced by 50%.', { resource: 'wood' }),
      ],
      isBreaking: true,
    });
  },
  (now) => {
    const region = pick(FICTIONAL_KINGDOMS);
    return withDuration('industry', 'moderate', now, {
      headline: `${region} Mines Report Suspiciously Cheerful Ore Boom`,
      source: pick(FICTIONAL_NEWSPAPERS),
      summary: 'Ore miners are moving faster, and pickaxe buyers are suddenly less patient.',
      body: `Surveyors claim the rocks are practically leaping into carts around ${region}. Tool orders are surging as every mine boss demands another rack of pickaxes.`,
      effects: [
        effect('resourceGainMultiplier', 1.35, 'Stone, copper, and iron gathering improved.', { resource: 'stone' }),
        effect('specificResourceMultiplier', 1.3, 'Copper gain improved by 30%.', { resource: 'copper' }),
        effect('specificResourceMultiplier', 1.3, 'Iron gain improved by 30%.', { resource: 'iron' }),
        effect('craftSpeedMultiplier', 1.25, 'Tool crafting is 25% faster.', { category: 'tools' }),
      ],
      isBreaking: true,
    });
  },
  (now) => {
    const company = pick(FICTIONAL_COMPANIES);
    const market = pick(FICTIONAL_MARKETS);
    const category = pick(NEWS_CATEGORIES);
    return withDuration('market', 'moderate', now, {
      headline: `${company} Floods the ${market} with Cheap ${CRAFTABLE_CATEGORY_LABELS[category]}`,
      source: pick(FICTIONAL_NEWSPAPERS),
      summary: `Local buyers are haggling hard on ${categoryLabel(category)} until the bargain crates run dry.`,
      body: `${company} insists its goods are "nearly forge-adjacent." Market inspectors are less certain, but the price pressure is real for now.`,
      effects: [
        effect('categorySellValueMultiplier', 0.7, `${CRAFTABLE_CATEGORY_LABELS[category]} sell value reduced by 30%.`, { category }),
      ],
      isBreaking: true,
    });
  },
  (now) => withDuration('festival', 'minor', now, {
    headline: 'Lantern-Nail Festival Announces Excessive Sparkle Standards',
    source: pick(FICTIONAL_NEWSPAPERS),
    summary: 'Festival buyers want decorative charms, rings, and any armor that looks good near a torch.',
    body: 'The annual Lantern-Nail Festival has begun with parades, snacks, and a stern decree that all accessories must be visible from across a crowded square.',
    effects: [
      effect('categorySellValueMultiplier', 1.35, 'Accessories sell for 35% more.', { category: 'accessories' }),
      effect('categorySellValueMultiplier', 1.15, 'Armor sells for 15% more.', { category: 'armor' }),
    ],
    isBreaking: false,
  }),
  (now) => withDuration('festival', 'moderate', now, {
    headline: 'Royal Tournament Posts Terrifying Armor Requirements',
    source: pick(FICTIONAL_NEWSPAPERS),
    summary: 'Contestants want shields, helms, and anything that makes being hit sound expensive.',
    body: 'Tournament officials deny that the rules were written by armor merchants, though the ink does smell faintly of molten coin.',
    effects: [
      effect('categorySellValueMultiplier', 1.3, 'Armor sells for 30% more.', { category: 'armor' }),
    ],
    isBreaking: true,
  }),
  (now) => withDuration('rumor', 'legendary', now, {
    headline: 'Monster Footprints Found Near the North Gate, Probably',
    source: 'Market Crier Rumor Desk',
    summary: 'Enchanted and gem-set weapons are commanding premium prices while everyone argues about footprint size.',
    body: 'No monster has been seen directly, but six apprentices swear they heard a roar, a burp, or a cart axle. Weapon buyers are not waiting for confirmation.',
    effects: [
      effect('categorySellValueMultiplier', 1.45, 'Melee weapons sell for 45% more.', { category: 'melee' }),
      effect('specificItemValueMultiplier', 1.4, 'Gem-embedded weapons sell for 40% more.', {
        itemId: pick(CRAFTABLE_ITEMS.filter((item) => item.id.includes('gem-embedded')).map((item) => item.id)),
      }),
    ],
    isBreaking: true,
  }),
  (now) => {
    const guild = pick(FICTIONAL_GUILDS);
    return withDuration('scandal', 'minor', now, {
      headline: `${guild} Accused of Measuring Reputation with Crooked Rulers`,
      source: pick(FICTIONAL_NEWSPAPERS),
      summary: 'Buyers are still buying, but praise is suddenly being counted twice and paid once.',
      body: `${guild} auditors deny wrongdoing, then immediately denied denying it. Until the confusion clears, customers are slower to praise good work.`,
      effects: [
        effect('reputationGainMultiplier', 0.75, 'Reputation gains reduced by 25%.'),
      ],
      isBreaking: true,
    });
  },
  (now) => withDuration('market', 'major', now, {
    headline: 'Trade Blockade Turns Rare Materials into Dinner Conversation',
    source: pick(FICTIONAL_NEWSPAPERS),
    summary: 'High-end buyers are paying more for rare goods while caravan captains argue over toll math.',
    body: 'The blockade is very official, very inconvenient, and somehow has fourteen different stamps. Rare-material items are suddenly fashionable.',
    effects: [
      effect('categorySellValueMultiplier', 1.2, 'Accessories sell for 20% more.', { category: 'accessories' }),
      effect('specificResourceMultiplier', 1.25, 'Gold production and gathering improved by 25%.', { resource: 'gold' }),
      effect('specificResourceMultiplier', 1.25, 'Emerald production and gathering improved by 25%.', { resource: 'emerald' }),
      effect('specificResourceMultiplier', 1.25, 'Diamond production and gathering improved by 25%.', { resource: 'diamond' }),
    ],
    isBreaking: true,
  }),
  (now) => {
    const product = pick(FICTIONAL_PRODUCTS);
    return withDuration('ad', 'minor', now, {
      headline: `Sponsored: Try the ${product}. Definitely Not Cursed.`,
      source: 'Paid Notice Board',
      summary: 'A shouty ad campaign has convinced buyers that pickaxes are the future, yesterday.',
      body: `The ${product} has not been evaluated by the Lantern Ledger Guild, local healers, or anyone with eyebrows. Still, pickaxe demand is up.`,
      effects: [
        effect('categorySellValueMultiplier', 1.2, 'Tools sell for 20% more.', { category: 'tools' }),
        effect('reputationGainMultiplier', 0.95, 'Reputation gains reduced by 5%.'),
      ],
      isBreaking: false,
    });
  },
  (now) => {
    const guild = pick(FICTIONAL_GUILDS);
    return withDuration('propaganda', 'minor', now, {
      headline: `${guild} Notice Claims Rival Anvils Are "Too Clangy"`,
      source: `${guild} Public Confidence Office`,
      summary: 'The notice is extremely official-looking and only slightly misspelled.',
      body: `${guild} pamphlets are circulating near the forge stalls. Customers are confused, amused, and briefly more expensive to impress.`,
      effects: [
        effect('reputationGainMultiplier', 0.85, 'Reputation gains reduced by 15%.'),
        effect('upgradeCostMultiplier', 0.9, 'Upgrade costs reduced by 10% while suppliers compete for trust.'),
      ],
      isBreaking: false,
    });
  },
  (now) => {
    const resource = pick(NEWS_RESOURCES);
    return withDuration('rumor', 'moderate', now, {
      headline: `Whisper Network Says ${MATERIAL_LABELS[resource]} Veins Are Singing`,
      source: 'Back Alley Bellows',
      summary: `${MATERIAL_LABELS[resource]} workers are suddenly confident, louder, and a little superstitious.`,
      body: `Nobody agrees on the tune, but everyone agrees the ${resourceLabel(resource)} flow has improved for now.`,
      effects: [
        effect('specificResourceMultiplier', 1.4, `${MATERIAL_LABELS[resource]} gain improved by 40%.`, { resource }),
      ],
      isBreaking: true,
    });
  },
];

export function generateNewsEvent(now = Date.now()): NewsEvent {
  return pick(templates)(now);
}
