import { games } from '../../games/registry';
import { getBest } from '../../games/bests';
import { starText } from '../../games/scoring';
import { lessons } from '../../lessons/registry';
import { useProgress } from '../../lessons/progress';
import type { PageProps } from '../types';

/** The list of practice games, with the lessons each one revisits. */
export function PracticePage({ openPage }: PageProps) {
  const { done } = useProgress();
  const title = (id: string) => lessons.find((l) => l.id === id)?.title ?? id;

  return (
    <section className="card">
      <p className="eyebrow">Practice</p>
      <h2>Games</h2>
      <p className="explain">
        Short rounds to exercise what the lessons taught. Each game is played on your piano (or by clicking the
        3D keys) and gives you stars and a score to beat.
      </p>
      <div className="game-grid">
        {games.map((g) => {
          const stars = g.levels.map((l) => getBest(g.id, l.id)?.stars ?? 0);
          const lessonsDone = g.lessons.filter((id) => done.includes(id)).length;
          return (
            <article key={g.id} className="game-tile">
              <div className="game-tile-head">
                <span className="game-icon" aria-hidden="true">{g.icon}</span>
                <h3>{g.title}</h3>
              </div>
              <p>{g.tagline}</p>
              <p className="muted game-lessons">
                Practises: {g.lessons.map((id) => (
                  <span key={id} className={done.includes(id) ? 'lesson-done' : ''}>{done.includes(id) ? '✓ ' : ''}{title(id)}</span>
                ))}
              </p>
              <p className="muted">
                {lessonsDone === g.lessons.length ? 'You have done all of these lessons.' : `${lessonsDone} of ${g.lessons.length} lessons done: you can play now, or do the lessons first.`}
              </p>
              <p className="level-stars" aria-label="Best stars on each level">
                {stars.map((s, i) => <span key={g.levels[i].id} title={g.levels[i].title}>{starText(s)}</span>)}
              </p>
              <button className="primary" onClick={() => openPage(`game-${g.id}`)}>Play {g.title}</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
