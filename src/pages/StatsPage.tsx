import { Link } from 'react-router-dom';
import { ResourceBar } from '../components/ResourceBar';
import { StatsPanel } from '../components/StatsPanel';
import type { GameModifiers, GameState } from '../types/game';

interface StatsPageProps {
  state: GameState;
  modifiers: GameModifiers;
}

export function StatsPage({ state, modifiers }: StatsPageProps) {
  return (
    <main className="stats-page">
      <ResourceBar state={state} />
      <section className="stats-page__hero">
        <h2>Forge Rush Stats</h2>
        <p>Track your forge output, inventory, upgrades, and production pace.</p>
        <Link className="secondary-btn stats-page__back" to="/">
          Back to Game
        </Link>
      </section>
      <StatsPanel state={state} modifiers={modifiers} />
    </main>
  );
}
