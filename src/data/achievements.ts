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
  {
    id: 'first-contract',
    name: 'First Contract',
    description: 'Complete 1 contract.',
    emoji: 'C',
    check: (state) => state.contracts.contractStats.completed >= 1,
  },
  {
    id: 'reliable-supplier',
    name: 'Reliable Supplier',
    description: 'Complete 10 contracts.',
    emoji: 'R',
    check: (state) => state.contracts.contractStats.completed >= 10,
  },
  {
    id: 'royal-contractor',
    name: 'Royal Contractor',
    description: 'Complete 25 contracts.',
    emoji: 'K',
    check: (state) => state.contracts.contractStats.completed >= 25,
  },
  {
    id: 'high-risk-high-reward',
    name: 'High Risk High Reward',
    description: 'Complete a legendary contract.',
    emoji: '!',
    check: (state) => state.contracts.contractStats.legendaryCompleted >= 1,
  },
  {
    id: 'deadline-survivor',
    name: 'Deadline Survivor',
    description: 'Complete a contract with under 10 seconds left.',
    emoji: 'T',
    check: (state) => state.contracts.contractStats.deadlineSurvivorCompletions >= 1,
  },
  {
    id: 'costly-mistake',
    name: 'Costly Mistake',
    description: 'Fail a contract.',
    emoji: 'X',
    check: (state) => state.contracts.contractStats.failed >= 1,
  },
  {
    id: 'perfect-dealer',
    name: 'Perfect Dealer',
    description: 'Complete 10 contracts without failing.',
    emoji: 'P',
    check: (state) => state.contracts.contractStats.bestCompletionStreak >= 10,
  },
  {
    id: 'contract-baron',
    name: 'Contract Baron',
    description: 'Unlock all 3 active contract slots.',
    emoji: 'B',
    check: (state) => state.contracts.unlockedContractSlots >= 3,
  },
  {
    id: 'first-investor',
    name: 'First Investor',
    description: 'Buy your first share.',
    emoji: '$',
    check: (state) => state.stockMarket.marketStats.totalBuys >= 1,
  },
  {
    id: 'paper-hands',
    name: 'Paper Hands',
    description: 'Sell a stock at a loss.',
    emoji: '-',
    check: (state) => (state.stockMarket.marketStats.worstTrade ?? 0) < 0,
  },
  {
    id: 'diamond-ledger',
    name: 'Diamond Ledger',
    description: 'Hold 1,000+ coins in stocks.',
    emoji: 'D',
    check: (state) => Object.values(state.stockMarket.portfolio).some((position) => {
      const company = state.stockMarket.companies.find((stock) => stock.ticker === position.ticker);
      return company ? company.currentPrice * position.shares >= 1_000 : false;
    }),
  },
  {
    id: 'market-baron',
    name: 'Market Baron',
    description: 'Reach 100,000 portfolio value.',
    emoji: 'M',
    check: (state) => Object.values(state.stockMarket.portfolio).reduce((sum, position) => {
      const company = state.stockMarket.companies.find((stock) => stock.ticker === position.ticker);
      return sum + (company ? company.currentPrice * position.shares : 0);
    }, 0) >= 100_000,
  },
  {
    id: 'disaster-trader',
    name: 'Disaster Trader',
    description: 'Profit after a negative market news event.',
    emoji: 'N',
    check: (state) => state.stockMarket.marketStats.disasterProfits >= 1,
  },
  {
    id: 'sector-specialist',
    name: 'Sector Specialist',
    description: 'Own shares in 5 companies from one sector.',
    emoji: 'S',
    check: (state) => {
      const sectors = new Map<string, number>();
      for (const position of Object.values(state.stockMarket.portfolio)) {
        if (position.shares <= 0) continue;
        const company = state.stockMarket.companies.find((stock) => stock.ticker === position.ticker);
        if (company) sectors.set(company.sector, (sectors.get(company.sector) ?? 0) + 1);
      }
      return [...sectors.values()].some((count) => count >= 5);
    },
  },
  {
    id: 'diversified',
    name: 'Diversified',
    description: 'Own shares in 10 different companies.',
    emoji: 'V',
    check: (state) => Object.values(state.stockMarket.portfolio).filter((position) => position.shares > 0).length >= 10,
  },
  {
    id: 'panic-seller',
    name: 'Panic Seller',
    description: 'Sell within 10 seconds of bad news.',
    emoji: '!',
    check: (state) => state.stockMarket.marketStats.panicSells >= 1,
  },
  {
    id: 'bullish-bet',
    name: 'Bullish Bet',
    description: 'Buy within 10 seconds of good news.',
    emoji: '+',
    check: (state) => state.stockMarket.marketStats.bullishBuys >= 1,
  },
];
