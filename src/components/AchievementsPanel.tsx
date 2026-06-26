import { ACHIEVEMENTS } from '../data/achievements';
import type { GameState } from '../types/game';

interface AchievementsPanelProps {
  state: GameState;
}

export function AchievementsPanel({ state }: AchievementsPanelProps) {
  const unlockedCount = ACHIEVEMENTS.filter((a) => state.achievementsUnlocked[a.id]).length;

  return (
    <section className="panel achievements-panel" aria-labelledby="achievements-heading">
      <h2 id="achievements-heading">
        Achievements
        <span className="achievement-count">{unlockedCount}/{ACHIEVEMENTS.length}</span>
      </h2>
      <p className="panel-subtitle">Milestones of a legendary smith.</p>
      <div className="achievement-grid">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = !!state.achievementsUnlocked[achievement.id];
          return (
            <div
              key={achievement.id}
              className={`achievement-card ${unlocked ? 'achievement-card--unlocked' : ''}`}
              title={achievement.description}
            >
              <span className="achievement-card__emoji" aria-hidden="true">
                {unlocked ? achievement.emoji : '🔒'}
              </span>
              <div>
                <strong>{achievement.name}</strong>
                <p>{achievement.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
