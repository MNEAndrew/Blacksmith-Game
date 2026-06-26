import type { CraftableItem, GemKey, MaterialKey, Rarity } from '../types/game';
import { MATERIAL_LABELS } from '../types/game';

const PICKAXE_DATA: Array<{
  material: MaterialKey;
  cost: Partial<Record<MaterialKey, number>>;
  coinValue: number;
  reputationGain: number;
  rarity: Rarity;
  requiredCraftTimeMs: number;
}> = [
  { material: 'wood', cost: { wood: 10 }, coinValue: 12, reputationGain: 1, rarity: 'common', requiredCraftTimeMs: 1_500 },
  { material: 'stone', cost: { wood: 5, stone: 10 }, coinValue: 25, reputationGain: 2, rarity: 'common', requiredCraftTimeMs: 2_000 },
  { material: 'copper', cost: { wood: 8, copper: 12 }, coinValue: 48, reputationGain: 3, rarity: 'uncommon', requiredCraftTimeMs: 2_750 },
  { material: 'iron', cost: { wood: 10, iron: 15 }, coinValue: 90, reputationGain: 5, rarity: 'uncommon', requiredCraftTimeMs: 3_500 },
  { material: 'gold', cost: { wood: 12, gold: 18 }, coinValue: 170, reputationGain: 9, rarity: 'rare', requiredCraftTimeMs: 4_500 },
  { material: 'emerald', cost: { wood: 14, emerald: 20 }, coinValue: 320, reputationGain: 15, rarity: 'epic', requiredCraftTimeMs: 5_500 },
  { material: 'diamond', cost: { wood: 16, diamond: 24 }, coinValue: 520, reputationGain: 24, rarity: 'legendary', requiredCraftTimeMs: 7_000 },
  { material: 'ruby', cost: { wood: 18, ruby: 28 }, coinValue: 760, reputationGain: 36, rarity: 'legendary', requiredCraftTimeMs: 8_500 },
  { material: 'mithril', cost: { wood: 20, mithril: 35 }, coinValue: 1_150, reputationGain: 55, rarity: 'mythic', requiredCraftTimeMs: 10_000 },
];

const GEAR_DATA: Array<{
  id: string;
  name: string;
  material: MaterialKey;
  kind: 'Sword' | 'Axe' | 'Shield';
  cost: Partial<Record<MaterialKey, number>>;
  coinValue: number;
  reputationGain: number;
  rarity: Rarity;
}> = [
  { id: 'wooden-training-sword', name: 'Wooden Training Sword', material: 'wood', kind: 'Sword', cost: { wood: 18 }, coinValue: 24, reputationGain: 1, rarity: 'common' },
  { id: 'wooden-round-shield', name: 'Wooden Round Shield', material: 'wood', kind: 'Shield', cost: { wood: 22 }, coinValue: 28, reputationGain: 1, rarity: 'common' },
  { id: 'stone-hand-axe', name: 'Stone Hand Axe', material: 'stone', kind: 'Axe', cost: { wood: 8, stone: 22 }, coinValue: 54, reputationGain: 2, rarity: 'common' },
  { id: 'stone-tower-shield', name: 'Stone Tower Shield', material: 'stone', kind: 'Shield', cost: { wood: 10, stone: 28 }, coinValue: 68, reputationGain: 3, rarity: 'common' },
  { id: 'copper-short-sword', name: 'Copper Short Sword', material: 'copper', kind: 'Sword', cost: { wood: 8, copper: 26 }, coinValue: 110, reputationGain: 5, rarity: 'uncommon' },
  { id: 'copper-battle-axe', name: 'Copper Battle Axe', material: 'copper', kind: 'Axe', cost: { wood: 10, copper: 32 }, coinValue: 138, reputationGain: 6, rarity: 'uncommon' },
  { id: 'iron-long-sword', name: 'Iron Long Sword', material: 'iron', kind: 'Sword', cost: { wood: 12, iron: 35 }, coinValue: 230, reputationGain: 10, rarity: 'uncommon' },
  { id: 'iron-kite-shield', name: 'Iron Kite Shield', material: 'iron', kind: 'Shield', cost: { wood: 14, iron: 44 }, coinValue: 285, reputationGain: 12, rarity: 'uncommon' },
  { id: 'gold-ceremonial-sword', name: 'Gold Ceremonial Sword', material: 'gold', kind: 'Sword', cost: { wood: 16, gold: 38 }, coinValue: 460, reputationGain: 20, rarity: 'rare' },
  { id: 'emerald-guard-shield', name: 'Emerald Guard Shield', material: 'emerald', kind: 'Shield', cost: { wood: 18, emerald: 42 }, coinValue: 760, reputationGain: 32, rarity: 'epic' },
  { id: 'diamond-war-axe', name: 'Diamond War Axe', material: 'diamond', kind: 'Axe', cost: { wood: 20, diamond: 48 }, coinValue: 1_150, reputationGain: 48, rarity: 'legendary' },
  { id: 'ruby-greatsword', name: 'Ruby Greatsword', material: 'ruby', kind: 'Sword', cost: { wood: 24, ruby: 54 }, coinValue: 1_640, reputationGain: 70, rarity: 'legendary' },
  { id: 'mithril-aegis', name: 'Mithril Aegis', material: 'mithril', kind: 'Shield', cost: { wood: 30, mithril: 65 }, coinValue: 2_400, reputationGain: 105, rarity: 'mythic' },
];

const GEM_EMBEDDED_DATA: Array<{
  id: string;
  name: string;
  material: MaterialKey;
  gem: GemKey;
  cost: Partial<Record<MaterialKey, number>>;
  gemCost: Partial<Record<GemKey, number>>;
  coinValue: number;
  reputationGain: number;
  rarity: Rarity;
}> = [
  {
    id: 'crude-gem-embedded-copper-axe',
    name: 'Crude Gem Embedded Copper Axe',
    material: 'copper',
    gem: 'crude',
    cost: { wood: 12, copper: 50 },
    gemCost: { crude: 1 },
    coinValue: 260,
    reputationGain: 12,
    rarity: 'uncommon',
  },
  {
    id: 'mediocre-gem-embedded-iron-shield',
    name: 'Mediocre Gem Embedded Iron Shield',
    material: 'iron',
    gem: 'mediocre',
    cost: { wood: 16, iron: 70 },
    gemCost: { mediocre: 1 },
    coinValue: 520,
    reputationGain: 24,
    rarity: 'rare',
  },
  {
    id: 'basic-gem-embedded-gold-sword',
    name: 'Basic Gem Embedded Gold Sword',
    material: 'gold',
    gem: 'polished',
    cost: { wood: 20, gold: 90 },
    gemCost: { polished: 1 },
    coinValue: 1_100,
    reputationGain: 48,
    rarity: 'epic',
  },
  {
    id: 'precious-gem-embedded-diamond-sword',
    name: 'Precious Gem Embedded Diamond Sword',
    material: 'diamond',
    gem: 'precious',
    cost: { wood: 28, diamond: 120 },
    gemCost: { precious: 1 },
    coinValue: 2_750,
    reputationGain: 120,
    rarity: 'mythic',
  },
];

function pickaxeId(material: MaterialKey): string {
  return `${material}-pickaxe`;
}

const PICKAXE_ITEMS: CraftableItem[] = PICKAXE_DATA.map((pickaxe) => {
  const materialName = MATERIAL_LABELS[pickaxe.material];

  return {
    id: pickaxeId(pickaxe.material),
    name: `${materialName} Pickaxe`,
    description: `A ${materialName.toLowerCase()} pickaxe used to push the forge into the next material tier.`,
    requiredResources: pickaxe.cost,
    requiredCraftTimeMs: pickaxe.requiredCraftTimeMs,
    coinValue: pickaxe.coinValue,
    reputationGain: pickaxe.reputationGain,
    unlockRequirement: {},
    emoji: '⛏',
    rarity: pickaxe.rarity,
    pickaxeMaterial: pickaxe.material,
  };
});

const GEAR_ITEMS: CraftableItem[] = GEAR_DATA.map((item) => ({
  id: item.id,
  name: item.name,
  description: `A sellable ${item.kind.toLowerCase()} forged from ${MATERIAL_LABELS[item.material].toLowerCase()}.`,
  requiredResources: item.cost,
  requiredCraftTimeMs: 3_500,
  coinValue: item.coinValue,
  reputationGain: item.reputationGain,
  unlockRequirement: { materialUnlocked: item.material },
  emoji: item.kind === 'Shield' ? '🛡' : item.kind === 'Axe' ? '🪓' : '⚔',
  rarity: item.rarity,
}));

const GEM_EMBEDDED_ITEMS: CraftableItem[] = GEM_EMBEDDED_DATA.map((item) => ({
  id: item.id,
  name: item.name,
  description: 'A high-value weapon set with a treasure hunter gem.',
  requiredResources: item.cost,
  requiredGems: item.gemCost,
  requiredCraftTimeMs: 7_500,
  coinValue: item.coinValue,
  reputationGain: item.reputationGain,
  unlockRequirement: { materialUnlocked: item.material },
  emoji: '💎',
  rarity: item.rarity,
}));

export const CRAFTABLE_ITEMS: CraftableItem[] = [
  ...PICKAXE_ITEMS,
  ...GEAR_ITEMS,
  ...GEM_EMBEDDED_ITEMS,
];

export const ITEMS_BY_ID = Object.fromEntries(
  CRAFTABLE_ITEMS.map((item) => [item.id, item]),
) as Record<string, CraftableItem>;

export const PICKAXE_ITEM_BY_MATERIAL = Object.fromEntries(
  CRAFTABLE_ITEMS.filter((item) => item.pickaxeMaterial)
    .map((item) => [item.pickaxeMaterial, item]),
) as Record<MaterialKey, CraftableItem>;
