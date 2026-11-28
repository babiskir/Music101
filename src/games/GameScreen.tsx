import { Suspense, useRef, useState } from 'react';
import { usePiano, usePianoNotes } from '../input/PianoInput';
import { getBest, recordResult, type Best } from './bests';
import { starText } from './scoring';
import type { GameDef, GameLevel, GameResult } from './types';

interface Props {
  game: GameDef;
  openPage: (id: string) => void;
}

type Screen =
  | { phase: 'menu' }
  | { phase: 'play'; level: GameLevel; run: number }
  | { phase: 'result'; level: GameLevel; run: number; result: GameResult; best: Best; isRecord: boolean };

/** One game's page: pick a level, play a round, see the result. The round itself is the game's own 3D scene. */
export function GameScreen({ game, openPage }: Props) {
  const [screen, setScreen] = useState<Screen>({ phase: 'menu' });
  const runs = useRef(0);

  const start = (level: GameLevel) => {
    runs.current++;
    setScreen({ phase: 'play', level, run: runs.current });
  };

  const finish = (level: GameLevel, run: number, result: GameResult) => {
    const { best, isRecord } = recordResult(game.id, level.id, { score: result.score, stars: result.stars });
    setScreen({ phase: 'result', level, run, result, best, isRecord });
  };

  if (screen.phase === 'play') {
    const { level, run } = screen;
    return (
      <section className="card game-card">
        <div className="game-head">
          <h2>{game.title} <small>{level.title}</small></h2>
          <button className="ghost" onClick={() => setScreen({ phase: 'menu' })}>Quit round</button>
        </div>
        <Suspense fallback={<p className="muted">Loading the 3D stage…</p>}>
          <game.Play key={run} level={level} onFinish={(r) => finish(level, run, r)} />
        </Suspense>
      </section>
    );
  }

  if (screen.phase === 'result') {
    return (
      <ResultCard
        game={game}
        level={screen.level}
        result={screen.result}
        best={screen.best}
        isRecord={screen.isRecord}
        onAgain={() => start(screen.level)}
        onLevels={() => setScreen({ phase: 'menu' })}
        onNext={(l) => start(l)}
        onAll={() => openPage('practice')}
      />
    );
  }

  return <LevelMenu game={game} onStart={start} onAll={() => openPage('practice')} />;
}

function LevelMenu({ game, onStart, onAll }: { game: GameDef; onStart: (l: GameLevel) => void; onAll: () => void }) {
  const piano = usePiano();
  return (
    <section className="card game-card">
      <div className="game-head">
        <h2>{game.title}</h2>
        <button className="ghost" onClick={onAll}>All games</button>
      </div>
      <p className="explain">{game.tagline}</p>
      <ul className="how-to">
        {game.howTo.map((t) => <li key={t}>{t}</li>)}
      </ul>
      {!piano.connected && (
        <p className="hint-box">
          No keyboard connected. You can still play: click the keys in the 3D keyboard. To play on your piano, connect it
          with the button at the top right.
        </p>
      )}
      <h3>Choose a level</h3>
      <div className="level-list">
        {game.levels.map((l, i) => {
          const best = getBest(game.id, l.id);
          return (
            <button key={l.id} className="level-btn" onClick={() => onStart(l)}>
              <span className="level-num">{i + 1}</span>
              <span className="level-text">
                <strong>{l.title}</strong>
                <span className="muted">{l.blurb}</span>
              </span>
              <span className="level-best" title={best ? `Best score: ${best.score}` : 'Not played yet'}>
                {best ? <>{starText(best.stars)}<small>{best.score}</small></> : <small>new</small>}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ResultCard({ game, level, result, best, isRecord, onAgain, onLevels, onNext, onAll }: {
  game: GameDef; level: GameLevel; result: GameResult; best: Best; isRecord: boolean;
  onAgain: () => void; onLevels: () => void; onNext: (l: GameLevel) => void; onAll: () => void;
}) {
  const shownAt = useRef(performance.now());
  const index = game.levels.findIndex((l) => l.id === level.id);
  const next = game.levels[index + 1];
  // Like the lessons: any key on the piano goes on (here: another round), after a moment so a stray press does not skip the result.
  usePianoNotes(() => {
    if (performance.now() - shownAt.current > 1500) onAgain();
  });

  return (
    <section className="card game-card result" data-testid="game-result">
      <div className="game-head">
        <h2>{game.title} <small>{level.title}</small></h2>
      </div>
      <div className="result-stars" aria-label={`${result.stars} of 3 stars`}>{starText(result.stars)}</div>
      <p className="result-headline">{result.headline}</p>
      <p className="result-score">{result.score} points{isRecord && <span className="badge hot">New best</span>}</p>
      <ul className="how-to">
        {result.details.map((d) => <li key={d}>{d}</li>)}
      </ul>
      <p className="muted">Best on this level: {starText(best.stars)} · {best.score} points</p>
      <div className="row">
        <button className="primary" onClick={onAgain}>Play again</button>
        {next && result.stars >= 1 && <button onClick={() => onNext(next)}>Next level: {next.title} →</button>}
        <button onClick={onLevels}>Choose a level</button>
        <button onClick={onAll}>All games</button>
      </div>
      <p className="continue-line">or play any key on your piano to play this level again</p>
    </section>
  );
}
