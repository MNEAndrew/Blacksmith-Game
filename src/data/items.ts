import type { CraftableItem, MaterialKey, Rarity } from '../types/game';

const PICKAXE_DATA: Array<{
  material: MaterialKey;
  previousMaterial?: MaterialKey;
  cost: Partial<Record<MaterialKey, number>>;
  coinValue: number;
  reputationGain: number;
  rarity: Rarity;
  requiredCraftTimeMs: number;
}> = [
  {
    material: 'wood',
    cost: { wood: 10 },
    coinValue: 12,
    reputationGain: 1,
    rarity: 'common',
    requiredCraftTimeMs: 1_500,
  },
  {
    material: 'stone',
    previousMaterial: 'wood',
    cost: { wood: 5, stone: 10 },
    coinValue: 25,
    reputationGain: 2,
    rarity: 'common',
    requiredCraftTimeMs: 2_000,
  },
  {
    material: 'copper',
    previousMaterial: 'stone',
    cost: { wood: 8, copper: 12 },
    coinValue: 48,
    reputationGain: 3,
    rarity: 'uncommon',
    requiredCraftTimeMs: 2_750,
  },
  {
    material: 'iron',
    previousMaterial: 'copper',
    cost: { wood: 10, iron: 15 },
    coinValue: 90,
    reputationGain: 5,
    rarity: 'uncommon',
    requiredCraftTimeMs: 3_500,
  },
  {
    material: 'gold',
    previousMaterial: 'iron',
    cost: { wood: 12, gold: 18 },
    coinValue: 170,
    reputationGain: 9,
    rarity: 'rare',
    requiredCraftTimeMs: 4_500,
  },
  {
    material: 'emerald',
    previousMaterial: 'gold',
    cost: { wood: 14, emerald: 20 },
    coinValue: 320,
    reputationGain: 15,
    rarity: 'epic',
    requiredCraftTimeMs: 5_500,
  },
  {
    material: 'diamond',
    previousMaterial: 'emerald',
    cost: { wood: 16, diamond: 24 },
    coinValue: 520,
    reputationGain: 24,
    rarity: 'legendary',
    requiredCraftTimeMs: 7_000,
  },
  {
    material: 'ruby',
    previousMaterial: 'diamond',
    cost: { wood: 18, ruby: 28 },
    coinValue: 760,
    reputationGain: 36,
    rarity: 'legendary',
    requiredCraftTimeMs: 8_500,
  },
  {
    material: 'mithril',
    previousMaterial: 'ruby',
    cost: { wood: 20, mithril: 35 },
    coinValue: 1_150,
    reputationGain: 55,
    rarity: 'mythic',
    requiredCraftTimeMs: 10_000,
  },
];

function titleCase(value: string): string {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function pickaxeId(material: MaterialKey): string {
  return `${material}-pickaxe`;
}

export const CRAFTABLE_ITEMS: CraftableItem[] = PICKAXE_DATA.map((pickaxe) => {
  const materialName = titleCase(pickaxe.material);
  const unlockRequirement =
    pickaxe.previousMaterial == null
      ? {}
      : {
          pickaxeCraft: {
            material: pickaxe.previousMaterial,
            count: 100,
          },
          upgradeId: ['gold', 'emerald', 'diamond', 'ruby', 'mithril'].includes(pickaxe.material)
            ? `${pickaxe.material}-miner-specialist`
            : undefined,
        };

  return {
    id: pickaxeId(pickaxe.material),
    name: `${materialName} Pickaxe`,
    description: `A ${materialName.toLowerCase()} pickaxe used to push the forge into the next material tier.`,
    requiredResources: pickaxe.cost,
    requiredCraftTimeMs: pickaxe.requiredCraftTimeMs,
    coinValue: pickaxe.coinValue,
    reputationGain: pickaxe.reputationGain,
    unlockRequirement,
    emoji: '⛏',
    rarity: pickaxe.rarity,
    pickaxeMaterial: pickaxe.material,
  };
});

export const ITEMS_BY_ID = Object.fromEntries(
  CRAFTABLE_ITEMS.map((item) => [item.id, item]),
) as Record<string, CraftableItem>;

export const PICKAXE_ITEM_BY_MATERIAL = Object.fromEntries(
  CRAFTABLE_ITEMS.filter((item) => item.pickaxeMaterial)
    .map((item) => [item.pickaxeMaterial, item]),
) as Record<MaterialKey, CraftableItem>;
