import type { Achievement } from '../types/game';
import { SPECIALIST_MATERIALS } from '../types/game';
import { getCraftedPickaxeCount } from '../utils/gameLogic';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-strike',
    name: 'First Strike',
    description: 'Swing your tools 25 times.',
    emoji: '👊',
    check: (state) => state.stats.totalClicks >= 25,
  },
  {
    id: 'apprentice-crafter',
    name: 'Apprentice Crafter',
    description: 'Craft your first item.',
    emoji: '🔧',
    check: (state) => state.stats.totalItemsCrafted >= 1,
  },
  {
    id: 'wood-pickaxe-master',
    name: 'Wood Pickaxe Master',
    description: 'Craft 100 Wood Pickaxes.',
    emoji: '⛏',
    check: (state) => getCraftedPickaxeCount(state, 'wood') >= 100,
  },
  {
    id: 'iron-age',
    name: 'Iron Age',
    description: 'Craft 100 Copper Pickaxes to unlock iron.',
    emoji: '⚒',
    check: (state) => getCraftedPickaxeCount(state, 'copper') >= 100,
  },
  {
    id: 'coin-collector',
    name: 'Coin Collector',
    description: 'Earn 200 coins total.',
    emoji: '🪙',
    check: (state) => state.stats.totalCoinsEarned >= 200,
  },
  {
    id: 'master-smith',
    name: 'Master Smith',
    description: 'Craft 40 items.',
    emoji: '⚒',
    check: (state) => state.stats.totalItemsCrafted >= 40,
  },
  {
    id: 'renowned-forge',
    name: 'Renowned Forge',
    description: 'Reach 40 reputation.',
    emoji: '⭐',
    check: (state) => state.resources.reputation >= 40,
  },
  {
    id: 'upgrade-enthusiast',
    name: 'Upgrade Enthusiast',
    description: 'Purchase 6 upgrades.',
    emoji: '📈',
    check: (state) => state.stats.totalUpgradesPurchased >= 6,
  },
  {
    id: 'specialist-crew',
    name: 'Specialist Crew',
    description: 'Hire 3 advanced miner specialists.',
    emoji: '⚙',
    check: (state) =>
      SPECIALIST_MATERIALS.filter((material) =>
        (state.upgradeLevels[`${material}-miner-specialist`] ?? 0) > 0,
      ).length >= 3,
  },
  {
    id: 'mithril-smith',
    name: 'Mithril Smith',
    description: 'Craft a Mithril Pickaxe.',
    emoji: '🏆',
    check: (state) => (state.craftedCounts['mithril-pickaxe'] ?? 0) > 0,
  },
];
