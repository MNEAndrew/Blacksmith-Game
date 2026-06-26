import type { Achievement } from '../types/game';

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
    emoji: '⚒️',
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
    id: 'gem-polisher',
    name: 'Gem Polisher',
    description: 'Polish 15 gems.',
    emoji: '💎',
    check: (state) => state.stats.totalGemsPolished >= 15,
  },
  {
    id: 'automation-king',
    name: 'Automation King',
    description: 'Own 3 automation upgrades at once.',
    emoji: '🤖',
    check: (state) => {
      const autoIds = ['apprentice-smith', 'lumber-helper', 'trade-cart'];
      return autoIds.filter((id) => (state.upgradeLevels[id] ?? 0) > 0).length >= 3;
    },
  },
  {
    id: 'legendary-smith',
    name: 'Legendary Smith',
    description: 'Craft a Stormforged Axe or Royal Anvil Plate.',
    emoji: '🏆',
    check: (state) =>
      (state.inventory['stormforged-axe'] ?? 0) > 0 ||
      (state.inventory['royal-anvil-plate'] ?? 0) > 0 ||
      state.stats.totalItemsCrafted >= 60,
  },
];
