import { useCallback, useState } from 'react';
import { ActionPanel } from './components/ActionPanel';
import { AchievementsPanel } from './components/AchievementsPanel';
import { AuthPanel } from './components/AuthPanel';
import { CraftingPanel } from './components/CraftingPanel';
import { FloatingText } from './components/FloatingText';
import { InventoryPanel } from './components/InventoryPanel';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { ResourceBar } from './components/ResourceBar';
import { StatsPanel } from './components/StatsPanel';
import { Toast } from './components/Toast';
import { UpgradePanel } from './components/UpgradePanel';
import { UserMenu } from './components/UserMenu';
import { useAuth } from './hooks/useAuth';
import { useGame } from './hooks/useGame';
import { useLeaderboard } from './hooks/useLeaderboard';
import { useLeaderboardSync } from './hooks/useLeaderboardSync';
import './styles.css';

function App() {
  const {
    state,
    modifiers,
    toasts,
    floatingTexts,
    mineOre,
    chopWood,
    polishGems,
    craftItem,
    sellItem,
    sellAll,
    buyUpgrade,
    resetGame,
    addToast,
  } = useGame();

  const {
    user,
    profile,
    loading: authLoading,
    authBusy,
    isConfigured,
    signUp,
    signIn,
    signOut,
  } = useAuth();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);

  const handleSyncError = useCallback(
    (message: string) => {
      addToast(`Leaderboard sync failed: ${message}`, 'warning');
    },
    [addToast],
  );

  const { syncNow } = useLeaderboardSync(state, user?.id ?? null, handleSyncError);

  const {
    entries: leaderboardEntries,
    loading: leaderboardLoading,
    error: leaderboardError,
    playerRank,
    refresh: refreshLeaderboard,
  } = useLeaderboard(isConfigured, user?.id);

  const handleReset = useCallback(() => {
    resetGame();
    setShowResetConfirm(false);
  }, [resetGame]);

  const handleSignUp = useCallback(
    (email: string, username: string, password: string) => signUp(email, username, password, state),
    [signUp, state],
  );

  const handleSignOut = useCallback(async () => {
    const result = await signOut();
    if (result.error) {
      addToast(result.error, 'warning');
    }
  }, [signOut, addToast]);

  const handleManualSync = useCallback(async () => {
    if (!user) return;

    setSyncBusy(true);
    try {
      const result = await syncNow();
      if (!result.error) {
        addToast('Leaderboard score synced.', 'success');
        refreshLeaderboard();
      }
    } finally {
      setSyncBusy(false);
    }
  }, [user, syncNow, addToast, refreshLeaderboard]);

  return (
    <div className="app">
      <header className="game-header">
        <div className="game-header__brand">
          <span className="game-header__logo" aria-hidden="true">🔥</span>
          <div>
            <h1>Forge Rush</h1>
            <p className="tagline">Strike hot. Craft bold. Rule the market.</p>
          </div>
        </div>
        <div className="game-header__actions">
          {!authLoading && (
            isConfigured && profile && user ? (
              <UserMenu
                username={profile.username}
                reputation={state.resources.reputation}
                onSignOut={handleSignOut}
                busy={authBusy}
              />
            ) : (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowAuth(true)}
              >
                {isConfigured ? 'Sign In' : 'Guest Mode'}
              </button>
            )
          )}
          <button
            type="button"
            className="reset-btn"
            onClick={() => setShowResetConfirm(true)}
            aria-label="Reset save data"
          >
            Reset Save
          </button>
        </div>
      </header>

      <ResourceBar resources={state.resources} />

      <main className="game-main">
        <div className="main-column">
          <ActionPanel
            modifiers={modifiers}
            onMineOre={mineOre}
            onChopWood={chopWood}
            onPolishGems={polishGems}
          />
          <CraftingPanel state={state} modifiers={modifiers} onCraft={craftItem} />
          <InventoryPanel
            state={state}
            modifiers={modifiers}
            onSell={sellItem}
            onSellAll={sellAll}
          />
        </div>

        <aside className="side-column">
          <LeaderboardPanel
            entries={leaderboardEntries}
            loading={leaderboardLoading}
            error={leaderboardError}
            playerRank={playerRank}
            currentUserId={user?.id ?? null}
            enabled={isConfigured}
            syncBusy={syncBusy}
            onRefresh={refreshLeaderboard}
            onSyncScore={handleManualSync}
          />
          <UpgradePanel state={state} onBuy={buyUpgrade} />
          <AchievementsPanel state={state} />
          <StatsPanel state={state} modifiers={modifiers} />
        </aside>
      </main>

      <footer className="game-footer">
        <p>
          Forge Rush v1.1 — Progress saves locally
          {isConfigured ? ' and reputation syncs when signed in.' : '.'}
        </p>
      </footer>

      <Toast toasts={toasts} />
      <FloatingText items={floatingTexts} />

      <AuthPanel
        open={showAuth}
        configured={isConfigured}
        onClose={() => setShowAuth(false)}
        onSignUp={handleSignUp}
        onSignIn={signIn}
        busy={authBusy}
      />

      {showResetConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <div className="modal">
            <h2 id="reset-title">Reset Save?</h2>
            <p>This will erase all local progress, upgrades, and achievements. This cannot be undone.</p>
            <p className="modal-note">Your leaderboard score on the server is not affected.</p>
            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="danger-btn" onClick={handleReset}>
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
