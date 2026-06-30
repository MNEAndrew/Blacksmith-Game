import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ACHIEVEMENTS } from '../data/achievements';
import { CRAFTABLE_ITEMS, ITEMS_BY_ID } from '../data/items';
import { UPGRADES, UPGRADES_BY_ID } from '../data/upgrades';
import type { CraftableCategory, GameModifiers, GameState, MaterialKey, Rarity } from '../types/game';
import {
  CRAFTABLE_CATEGORY_LABELS,
  MATERIAL_LABELS,
  MATERIAL_ORDER,
} from '../types/game';
import {
  formatNumber,
  getInventoryCount,
  getTotalProductionPerSecond,
} from '../utils/gameLogic';
import { calculatePortfolioSummary, getFavoriteStock } from '../utils/portfolioCalculations';

interface StatsPanelProps {
  state: GameState;
  modifiers: GameModifiers;
  loggedIn?: boolean;
  leaderboardEnabled?: boolean;
  leaderboardRank?: number | null;
  leaderboardLoading?: boolean;
  leaderboardError?: string | null;
}

interface StatCardProps {
  label: string;
  value: string;
  detail?: string;
}

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
const CATEGORY_ORDER: CraftableCategory[] = ['tools', 'melee', 'ranged', 'armor', 'accessories'];

function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {detail && <span className="stat-detail">{detail}</span>}
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded yet';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function getRankInfo(reputation: number) {
  const ranks = [
    { title: 'Apprentice', required: 0 },
    { title: 'Journeyman', required: 50 },
    { title: 'Guild Smith', required: 250 },
    { title: 'Master Smith', required: 1_000 },
    { title: 'Forge Lord', required: 5_000 },
    { title: 'Mythic Artisan', required: 15_000 },
  ];
  const current = [...ranks].reverse().find((rank) => reputation >= rank.required) ?? ranks[0];
  const next = ranks.find((rank) => rank.required > reputation) ?? null;
  const previousRequired = current.required;
  const nextRequired = next?.required ?? current.required;
  const ratio = next
    ? Math.min(1, Math.max(0, (reputation - previousRequired) / (nextRequired - previousRequired)))
    : 1;

  return { current, next, ratio };
}

function BreakdownBars({ rows, emptyText }: {
  rows: Array<{ label: string; value: number }>;
  emptyText: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 0);
  if (max <= 0) {
    return <p className="stats-empty">{emptyText}</p>;
  }

  return (
    <div className="breakdown-bars">
      {rows.map((row) => {
        const percent = Math.round((row.value / max) * 100);
        return (
          <div className="breakdown-row" key={row.label}>
            <div className="breakdown-row__label">
              <span>{row.label}</span>
              <strong>{formatNumber(row.value)}</strong>
            </div>
            <div className="progress-track">
              <span className="progress-fill" style={{ width: `${percent}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProgressRing({ percent, label }: { percent: number; label: string }) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));

  return (
    <div className="progress-ring-card">
      <div
        className="progress-ring"
        style={{ '--progress': `${safePercent}%` } as CSSProperties}
        aria-label={`${label}: ${safePercent}%`}
      >
        <span>{safePercent}%</span>
      </div>
      <span>{label}</span>
    </div>
  );
}

function getMostCraftedItem(craftedByItem: Record<string, number>): string {
  const [itemId, count] = Object.entries(craftedByItem)
    .sort(([, a], [, b]) => b - a)[0] ?? [];
  if (!itemId || !count) return 'None yet';
  return `${ITEMS_BY_ID[itemId]?.name ?? itemId} (${formatNumber(count)})`;
}

function getMostUpgradedUpgrade(state: GameState): string {
  const [upgradeId, level] = Object.entries(state.upgradeLevels)
    .sort(([, a], [, b]) => b - a)[0] ?? [];
  if (!upgradeId || !level) return 'None yet';
  return `${UPGRADES_BY_ID[upgradeId]?.name ?? upgradeId} (${level})`;
}

function getAchievementProgress(state: GameState, achievementId: string): number {
  if (state.achievementsUnlocked[achievementId]) return 1;
  switch (achievementId) {
    case 'first-strike':
      return Math.min(1, state.stats.totalClicks / 25);
    case 'apprentice-crafter':
      return Math.min(1, state.stats.totalItemsCrafted / 1);
    case 'wood-pickaxe-master':
      return Math.min(1, (state.craftedCounts['wood-pickaxe'] ?? 0) / 100);
    case 'iron-age':
      return Math.min(1, (state.craftedCounts['copper-pickaxe'] ?? 0) / 100);
    case 'coin-collector':
      return Math.min(1, state.stats.totalCoinsEarned / 200);
    case 'master-smith':
      return Math.min(1, state.stats.totalItemsCrafted / 40);
    case 'renowned-forge':
      return Math.min(1, state.resources.reputation / 40);
    case 'upgrade-enthusiast':
      return Math.min(1, state.stats.totalUpgradesPurchased / 6);
    case 'specialist-crew': {
      const hired = ['gold', 'emerald', 'diamond', 'ruby', 'mithril']
        .filter((material) => (state.upgradeLevels[`${material}-miner-specialist`] ?? 0) > 0)
        .length;
      return Math.min(1, hired / 3);
    }
    case 'mithril-smith':
      return Math.min(1, (state.craftedCounts['mithril-pickaxe'] ?? 0) / 1);
    case 'first-contract':
      return Math.min(1, state.contracts.contractStats.completed / 1);
    case 'reliable-supplier':
      return Math.min(1, state.contracts.contractStats.completed / 10);
    case 'royal-contractor':
      return Math.min(1, state.contracts.contractStats.completed / 25);
    case 'high-risk-high-reward':
      return Math.min(1, state.contracts.contractStats.legendaryCompleted / 1);
    case 'deadline-survivor':
      return Math.min(1, state.contracts.contractStats.deadlineSurvivorCompletions / 1);
    case 'costly-mistake':
      return Math.min(1, state.contracts.contractStats.failed / 1);
    case 'perfect-dealer':
      return Math.min(1, state.contracts.contractStats.bestCompletionStreak / 10);
    case 'contract-baron':
      return Math.min(1, state.contracts.unlockedContractSlots / 3);
    case 'first-investor':
      return Math.min(1, state.stockMarket.marketStats.totalBuys / 1);
    case 'paper-hands':
      return (state.stockMarket.marketStats.worstTrade ?? 0) < 0 ? 1 : 0;
    case 'diamond-ledger': {
      const summary = calculatePortfolioSummary(state.stockMarket);
      const biggest = summary.biggestHolding?.currentValue ?? 0;
      return Math.min(1, biggest / 1_000);
    }
    case 'market-baron':
      return Math.min(1, calculatePortfolioSummary(state.stockMarket).totalPortfolioValue / 100_000);
    case 'disaster-trader':
      return Math.min(1, state.stockMarket.marketStats.disasterProfits / 1);
    case 'sector-specialist':
      return Math.min(1, Math.max(0, ...Array.from(new Set(state.stockMarket.companies.map((company) => company.sector))).map((sector) =>
        Object.values(state.stockMarket.portfolio).filter((position) =>
          position.shares > 0 && state.stockMarket.companies.find((company) => company.ticker === position.ticker)?.sector === sector,
        ).length,
      )) / 5);
    case 'diversified':
      return Math.min(1, Object.values(state.stockMarket.portfolio).filter((position) => position.shares > 0).length / 10);
    case 'panic-seller':
      return Math.min(1, state.stockMarket.marketStats.panicSells / 1);
    case 'bullish-bet':
      return Math.min(1, state.stockMarket.marketStats.bullishBuys / 1);
    default:
      return 0;
  }
}

function getMaterialTotal(
  manual: Record<MaterialKey, number>,
  auto: Record<MaterialKey, number>,
  materials: MaterialKey[],
): number {
  return materials.reduce((sum, material) => sum + (manual[material] ?? 0) + (auto[material] ?? 0), 0);
}

export function StatsPanel({
  state,
  modifiers,
  loggedIn = false,
  leaderboardEnabled = false,
  leaderboardRank = null,
  leaderboardLoading = false,
  leaderboardError = null,
}: StatsPanelProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const production = getTotalProductionPerSecond(modifiers);
  const portfolioSummary = calculatePortfolioSummary(state.stockMarket);
  const favoriteStock = getFavoriteStock(state.stockMarket.transactions);
  const rank = getRankInfo(state.resources.reputation);
  const achievementCount = ACHIEVEMENTS.filter((achievement) => state.achievementsUnlocked[achievement.id]).length;
  const achievementPercent = ACHIEVEMENTS.length > 0 ? (achievementCount / ACHIEVEMENTS.length) * 100 : 0;
  const purchasedUpgradeLevels = Object.values(state.upgradeLevels).reduce((sum, level) => sum + level, 0);
  const maxUpgradeLevels = UPGRADES.reduce((sum, upgrade) => sum + upgrade.maxLevel, 0);
  const upgradePercent = maxUpgradeLevels > 0 ? (purchasedUpgradeLevels / maxUpgradeLevels) * 100 : 0;
  const activeAutocrafters = Object.values(state.activeCraftingSpecialists).filter(Boolean).length;
  const firstPlayedTime = Date.parse(state.stats.firstPlayedAt);
  const playTime = Number.isNaN(firstPlayedTime) ? 0 : now - firstPlayedTime;

  const rarityRows = RARITY_ORDER.map((rarity) => ({
    label: rarity[0].toUpperCase() + rarity.slice(1),
    value: state.stats.craftedByRarity[rarity] ?? 0,
  }));
  const categoryRows = CATEGORY_ORDER.map((category) => ({
    label: CRAFTABLE_CATEGORY_LABELS[category],
    value: state.stats.craftedByCollection[category] ?? 0,
  }));
  const manualAutoRows = [
    { label: 'Manual crafts', value: state.stats.manualCrafts },
    { label: 'Autocrafts', value: state.stats.autoCrafts },
  ];
  const resourceRows = [
    {
      label: 'Wood chopped',
      value: getMaterialTotal(state.stats.resourcesGainedManual, state.stats.resourcesGainedAuto, ['wood']),
    },
    {
      label: 'Ore mined',
      value: getMaterialTotal(state.stats.resourcesGainedManual, state.stats.resourcesGainedAuto, ['stone', 'copper', 'iron']),
    },
    {
      label: 'Rare materials',
      value: getMaterialTotal(state.stats.resourcesGainedManual, state.stats.resourcesGainedAuto, ['gold', 'emerald', 'diamond', 'ruby', 'mithril']),
    },
    { label: 'Gems found', value: state.stats.totalGemsPolished },
  ];
  const currentResourcesRows = MATERIAL_ORDER.map((material) => ({
    label: MATERIAL_LABELS[material],
    value: state.resources[material],
  }));

  const closestAchievements = useMemo(() => (
    ACHIEVEMENTS
      .filter((achievement) => !state.achievementsUnlocked[achievement.id])
      .map((achievement) => ({
        ...achievement,
        progress: getAchievementProgress(state, achievement.id),
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3)
  ), [state]);

  const recentAchievements = ACHIEVEMENTS
    .filter((achievement) => state.achievementsUnlocked[achievement.id])
    .slice(-3)
    .reverse();

  return (
    <section className="stats-dashboard" aria-labelledby="stats-heading">
      <div className="panel stats-overview">
        <div className="panel-header-row">
          <div>
            <h2 id="stats-heading">Forge Analytics</h2>
            <p className="panel-subtitle">A live readout of crafting, sales, resources, upgrades, and account progress.</p>
          </div>
        </div>
        <div className="stats-card-grid">
          <StatCard label="Current reputation" value={formatNumber(state.resources.reputation)} detail={rank.current.title} />
          <StatCard label="Best synced reputation" value={formatNumber(state.stats.bestSyncedReputation)} detail={state.stats.lastSyncedAt ? formatDate(state.stats.lastSyncedAt) : 'Not synced yet'} />
          <StatCard label="Current coins" value={formatNumber(state.resources.coins)} detail={`${formatNumber(state.stats.totalCoinsEarned)} earned all time`} />
          <StatCard label="News events seen" value={formatNumber(state.stats.totalNewsEventsSeen)} detail={`${state.news.activeEvents.length} active now`} />
          <StatCard label="Contracts completed" value={formatNumber(state.contracts.contractStats.completed)} detail={`${state.contracts.activeContracts.length} active now`} />
          <StatCard label="Portfolio value" value={formatNumber(portfolioSummary.totalPortfolioValue)} detail={`${state.stockMarket.companies.length} fake tickers`} />
          <StatCard label="Total play time" value={formatDuration(playTime)} detail={`First played ${formatDate(state.stats.firstPlayedAt)}`} />
          <StatCard label="Last saved" value={formatDate(state.stats.lastSavedAt)} detail="Local browser save" />
          <StatCard label="Game stage" value={rank.current.title} detail={rank.next ? `Next: ${rank.next.title}` : 'Top rank reached'} />
        </div>
      </div>

      <div className="stats-layout">
        <section className="panel stats-section">
          <h3>Crafting</h3>
          <div className="stats-card-grid stats-card-grid--compact">
            <StatCard label="Items crafted" value={formatNumber(state.stats.totalItemsCrafted)} />
            <StatCard label="Manual crafts" value={formatNumber(state.stats.manualCrafts)} />
            <StatCard label="Autocrafts" value={formatNumber(state.stats.autoCrafts)} />
            <StatCard label="Most crafted item" value={getMostCraftedItem(state.stats.craftedByItem)} />
            <StatCard label="Pickaxes crafted" value={formatNumber(CRAFTABLE_ITEMS.filter((item) => item.pickaxeMaterial).reduce((sum, item) => sum + (state.craftedCounts[item.id] ?? 0), 0))} />
            <StatCard label="Legendary / Mythic" value={formatNumber((state.stats.craftedByRarity.legendary ?? 0) + (state.stats.craftedByRarity.mythic ?? 0))} />
          </div>
          <div className="chart-grid">
            <div className="mini-chart">
              <h4>Manual vs Auto</h4>
              <BreakdownBars rows={manualAutoRows} emptyText="Craft items manually or hire specialists to populate this chart." />
            </div>
            <div className="mini-chart">
              <h4>Rarity Breakdown</h4>
              <BreakdownBars rows={rarityRows} emptyText="Crafted item rarity counts will appear here." />
            </div>
            <div className="mini-chart">
              <h4>Collection Breakdown</h4>
              <BreakdownBars rows={categoryRows} emptyText="Crafting categories will appear here." />
            </div>
          </div>
        </section>

        <section className="panel stats-section">
          <h3>Resources</h3>
          <div className="stats-card-grid stats-card-grid--compact">
            <StatCard label="Wood chopped" value={formatNumber(resourceRows[0].value)} />
            <StatCard label="Ore mined" value={formatNumber(resourceRows[1].value)} />
            <StatCard label="Gems found" value={formatNumber(state.stats.totalGemsPolished)} />
            <StatCard label="Rare materials earned" value={formatNumber(resourceRows[2].value)} />
            <StatCard label="Production / sec" value={production.toFixed(1)} />
            <StatCard label="Best production / sec" value={state.stats.bestProductionPerSecond.toFixed(1)} />
          </div>
          <div className="chart-grid">
            <div className="mini-chart">
              <h4>Resource Totals</h4>
              <BreakdownBars rows={resourceRows} emptyText="Gather or automate resources to populate totals." />
            </div>
            <div className="mini-chart">
              <h4>Current Materials</h4>
              <BreakdownBars rows={currentResourcesRows} emptyText="Current material inventory is empty." />
            </div>
          </div>
        </section>

        <section className="panel stats-section">
          <h3>Upgrades and Sales</h3>
          <div className="stats-card-grid stats-card-grid--compact">
            <StatCard label="Upgrades purchased" value={formatNumber(state.stats.totalUpgradesPurchased)} />
            <StatCard label="Most upgraded" value={getMostUpgradedUpgrade(state)} />
            <StatCard label="Automation level" value={formatNumber(Object.entries(state.upgradeLevels).filter(([id]) => UPGRADES_BY_ID[id]?.effectType !== 'sellMultiplier').reduce((sum, [, level]) => sum + level, 0))} />
            <StatCard label="Auto-craft active" value={formatNumber(activeAutocrafters)} />
            <StatCard label="Coins spent" value={formatNumber(state.stats.coinsSpentOnUpgrades)} />
            <StatCard label="Upgrade completion" value={`${Math.round(upgradePercent)}%`} />
            <StatCard label="Items sold" value={formatNumber(state.stats.totalItemsSold)} />
            <StatCard label="Coins from selling" value={formatNumber(state.stats.totalCoinsFromSelling)} />
            <StatCard label="Items in stock" value={formatNumber(getInventoryCount(state))} />
            <StatCard label="Event bonus coins" value={formatNumber(state.stats.coinsGainedFromEventBonuses)} />
            <StatCard label="Event bonus reputation" value={formatNumber(state.stats.reputationGainedFromEventBonuses)} />
          </div>
          <div className="ring-grid">
            <ProgressRing percent={upgradePercent} label="Upgrade completion" />
            <ProgressRing percent={rank.ratio * 100} label={rank.next ? `Next: ${rank.next.title}` : 'Max rank'} />
          </div>
        </section>

        <section className="panel stats-section">
          <h3>News Economy</h3>
          <div className="stats-card-grid stats-card-grid--compact">
            <StatCard label="Total news events seen" value={formatNumber(state.stats.totalNewsEventsSeen)} />
            <StatCard label="Most impactful event" value={state.stats.mostImpactfulNewsEventHeadline ?? 'None yet'} />
            <StatCard label="Time under positive modifiers" value={formatDuration(state.stats.timeUnderPositiveNewsMs)} />
            <StatCard label="Time under negative modifiers" value={formatDuration(state.stats.timeUnderNegativeNewsMs)} />
            <StatCard label="Coins gained from event bonuses" value={formatNumber(state.stats.coinsGainedFromEventBonuses)} />
            <StatCard label="Reputation gained from event bonuses" value={formatNumber(state.stats.reputationGainedFromEventBonuses)} />
          </div>
        </section>

        <section className="panel stats-section">
          <h3>Contracts</h3>
          <div className="stats-card-grid stats-card-grid--compact">
            <StatCard label="Completed" value={formatNumber(state.contracts.contractStats.completed)} />
            <StatCard label="Failed" value={formatNumber(state.contracts.contractStats.failed)} />
            <StatCard label="Expired" value={formatNumber(state.contracts.contractStats.expired)} />
            <StatCard label="Coins earned" value={formatNumber(state.contracts.contractStats.coinsEarned)} />
            <StatCard label="Reputation earned" value={formatNumber(state.contracts.contractStats.reputationEarned)} />
            <StatCard label="Reputation lost" value={formatNumber(state.contracts.contractStats.reputationLost)} />
            <StatCard label="Largest reward" value={formatNumber(state.contracts.contractStats.largestReward)} />
            <StatCard label="Worst penalty" value={formatNumber(state.contracts.contractStats.worstPenalty)} />
            <StatCard label="Active slots unlocked" value={`${state.contracts.unlockedContractSlots} / 3`} />
          </div>
        </section>

        <section className="panel stats-section">
          <h3>Stock Market</h3>
          <div className="stats-card-grid stats-card-grid--compact">
            <StatCard label="Total stock purchases" value={formatNumber(state.stockMarket.marketStats.totalBuys)} />
            <StatCard label="Total stock sales" value={formatNumber(state.stockMarket.marketStats.totalSells)} />
            <StatCard label="Realized profit/loss" value={formatNumber(state.stockMarket.marketStats.realizedProfitLoss)} />
            <StatCard label="Unrealized profit/loss" value={formatNumber(portfolioSummary.unrealizedProfitLoss)} />
            <StatCard label="Total portfolio value" value={formatNumber(portfolioSummary.totalPortfolioValue)} />
            <StatCard label="Best stock trade" value={state.stockMarket.marketStats.bestTrade === null ? 'None yet' : formatNumber(state.stockMarket.marketStats.bestTrade)} />
            <StatCard label="Worst stock trade" value={state.stockMarket.marketStats.worstTrade === null ? 'None yet' : formatNumber(state.stockMarket.marketStats.worstTrade)} />
            <StatCard label="Favorite stock" value={favoriteStock ?? 'None yet'} />
            <StatCard label="Biggest holding" value={portfolioSummary.biggestHolding?.ticker ?? 'None yet'} />
            <StatCard label="Market news seen" value={formatNumber(state.stockMarket.marketStats.marketNewsSeen)} />
            <StatCard label="Negative event losses" value={formatNumber(state.stockMarket.marketStats.coinsLostFromNegativeMarketEvents)} />
            <StatCard label="Positive event gains" value={formatNumber(state.stockMarket.marketStats.coinsGainedFromPositiveMarketEvents)} />
          </div>
        </section>

        <section className="panel stats-section">
          <h3>Achievements and Account</h3>
          <div className="stats-card-grid stats-card-grid--compact">
            <StatCard label="Achievements unlocked" value={`${achievementCount} / ${ACHIEVEMENTS.length}`} />
            <StatCard label="Completion" value={`${Math.round(achievementPercent)}%`} />
            <StatCard label="Leaderboard rank" value={leaderboardLoading ? 'Loading...' : leaderboardRank ? `#${leaderboardRank}` : 'Not ranked'} detail={leaderboardError ?? undefined} />
            <StatCard label="Account status" value={loggedIn ? 'Logged in' : 'Guest'} detail={leaderboardEnabled ? 'Supabase configured' : 'Supabase unavailable'} />
            <StatCard label="Sync status" value={state.stats.lastSyncedAt ? 'Synced' : 'Not synced'} detail={state.stats.lastSyncedAt ? formatDate(state.stats.lastSyncedAt) : 'Use Sync Score on Game'} />
            <StatCard label="Best uploaded" value={formatNumber(state.stats.bestSyncedReputation)} />
          </div>
          <div className="ring-grid">
            <ProgressRing percent={achievementPercent} label="Achievement completion" />
            <div className="mini-chart">
              <h4>Recently Unlocked</h4>
              {recentAchievements.length > 0 ? (
                <ul className="stats-list">
                  {recentAchievements.map((achievement) => (
                    <li key={achievement.id}>{achievement.emoji} {achievement.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="stats-empty">Unlock achievements to see recent medals here.</p>
              )}
            </div>
            <div className="mini-chart">
              <h4>Closest Achievements</h4>
              {closestAchievements.length > 0 ? (
                <div className="breakdown-bars">
                  {closestAchievements.map((achievement) => (
                    <div className="breakdown-row" key={achievement.id}>
                      <div className="breakdown-row__label">
                        <span>{achievement.name}</span>
                        <strong>{Math.round(achievement.progress * 100)}%</strong>
                      </div>
                      <div className="progress-track">
                        <span className="progress-fill" style={{ width: `${Math.round(achievement.progress * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="stats-empty">Every achievement is complete.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
