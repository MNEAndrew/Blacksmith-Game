import type { MaterialKey, Upgrade } from '../types/game';

const SPECIALIST_UPGRADES: Array<{
  material: Extract<MaterialKey, 'gold' | 'emerald' | 'diamond' | 'ruby' | 'mithril'>;
  previousMaterial: MaterialKey;
  baseCost: number;
}> = [
  { material: 'gold', previousMaterial: 'iron', baseCost: 1_500 },
  { material: 'emerald', previousMaterial: 'gold', baseCost: 3_500 },
  { material: 'diamond', previousMaterial: 'emerald', baseCost: 7_500 },
  { material: 'ruby', previousMaterial: 'diamond', baseCost: 12_500 },
  { material: 'mithril', previousMaterial: 'ruby', baseCost: 20_000 },
];

function titleCase(value: string): string {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

export const UPGRADES: Upgrade[] = [
  {
    id: 'stronger-tools',
    name: 'Stronger Tools',
    description: 'Gather more from every manual swing.',
    baseCost: 30,
    costMultiplier: 1.55,
    effectType: 'materialPerClick',
    effectPerLevel: 1,
    maxLevel: 12,
  },
  {
    id: 'hotter-furnace',
    name: 'Hotter Furnace',
    description: 'Heat-treated goods fetch higher prices.',
    baseCost: 120,
    costMultiplier: 2.1,
    effectType: 'sellMultiplier',
    effectPerLevel: 0.12,
    maxLevel: 6,
  },
  {
    id: 'lumber-helper',
    name: 'Lumber Helper',
    description: 'Someone else stacks firewood for you.',
    baseCost: 175,
    costMultiplier: 1.75,
    effectType: 'materialPerSecond',
    effectPerLevel: 0.6,
    maxLevel: 10,
    materialKey: 'wood',
  },
  {
    id: 'stone-miner',
    name: 'Stone Miner',
    description: 'Automates stone collection once stone is available.',
    baseCost: 260,
    costMultiplier: 1.85,
    effectType: 'materialPerSecond',
    effectPerLevel: 0.5,
    maxLevel: 8,
    materialKey: 'stone',
    unlockRequirement: {
      pickaxeCraft: { material: 'wood', count: 100 },
    },
  },
  {
    id: 'copper-miner',
    name: 'Copper Miner',
    description: 'Automates copper collection once copper is available.',
    baseCost: 420,
    costMultiplier: 1.9,
    effectType: 'materialPerSecond',
    effectPerLevel: 0.45,
    maxLevel: 8,
    materialKey: 'copper',
    unlockRequirement: {
      pickaxeCraft: { material: 'stone', count: 100 },
    },
  },
  {
    id: 'iron-miner',
    name: 'Iron Miner',
    description: 'Automates iron collection once iron is available.',
    baseCost: 700,
    costMultiplier: 1.95,
    effectType: 'materialPerSecond',
    effectPerLevel: 0.4,
    maxLevel: 8,
    materialKey: 'iron',
    unlockRequirement: {
      pickaxeCraft: { material: 'copper', count: 100 },
    },
  },
  {
    id: 'trade-cart',
    name: 'Trade Cart',
    description: 'Automatically delivers crafted goods to market.',
    baseCost: 550,
    costMultiplier: 2.4,
    effectType: 'autoSell',
    effectPerLevel: 1,
    maxLevel: 5,
  },
  {
    id: 'treasure-hunter',
    name: 'Treasure Hunter',
    description: 'Unlocks gem expeditions. Each expedition slot costs 10 Gold and can return crude, mediocre, polished, or precious gems.',
    baseCost: 900,
    costMultiplier: 1.85,
    effectType: 'treasureHunter',
    effectPerLevel: 1,
    maxLevel: 10,
    unlockRequirement: {
      pickaxeCraft: { material: 'iron', count: 100 },
    },
  },
  {
    id: 'master-bellows',
    name: 'Master Bellows',
    description: 'Stoke the flames so automated work runs faster.',
    baseCost: 450,
    costMultiplier: 2.2,
    effectType: 'automationSpeed',
    effectPerLevel: 0.18,
    maxLevel: 5,
  },
  {
    id: 'guild-banner',
    name: 'Guild Banner',
    description: 'Your forge\'s renown spreads with every sale.',
    baseCost: 220,
    costMultiplier: 1.9,
    effectType: 'reputationMultiplier',
    effectPerLevel: 0.15,
    maxLevel: 6,
  },
  ...SPECIALIST_UPGRADES.map((upgrade): Upgrade => ({
    id: `${upgrade.material}-miner-specialist`,
    name: `${titleCase(upgrade.material)} Miner Specialist`,
    description: `Unlocks automated ${upgrade.material} acquisition. ${titleCase(upgrade.material)} cannot be gathered manually.`,
    baseCost: upgrade.baseCost,
    costMultiplier: 1,
    effectType: 'minerSpecialist',
    effectPerLevel: 0.25,
    maxLevel: 1,
    materialKey: upgrade.material,
    unlockRequirement: {
      pickaxeCraft: {
        material: upgrade.previousMaterial,
        count: 100,
      },
    },
  })),
];

export const UPGRADES_BY_ID = Object.fromEntries(
  UPGRADES.map((upgrade) => [upgrade.id, upgrade]),
) as Record<string, Upgrade>;
