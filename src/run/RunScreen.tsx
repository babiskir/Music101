import { useEffect, useMemo, useRef, useState } from 'react';
import { stopAllSound } from '../audio/audioContext';
import { ArrowRightIcon, RestartIcon } from '../app/icons';
import { StepView } from '../guide/StepView';
import { usePiano } from '../input/PianoInput';
import { applyTwists, multiplier, pickById } from './modifiers';
import { buildPool } from './pool';
import { recordOf, saveRun, totals, type Saved } from './records';
import { randomSeed } from './rng';
import { attempt, choosePick, currentIndex, newRun, skipStep, stepDone, streakMultiplier, type RunState } from './run';

export interface RunConfig {
  /** Record id: the class id, `<class>-hard`, or 'daily'. */
  id: string;
  title: string;
  classIds: string[];
  hard?: boolean;
  /** Fixed seed (daily run); otherwise every run is new. */
  seed?: number;
  /** Date of a daily run. */
  daily?: string;
  /** The class whose normal run this is (for the hard-mode unlock). */
  classId?: string;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ''));

/** One run: rounds of random exercises with hearts, a streak multiplier and picks between rounds. */
export function RunScreen({ config, onExit }: { config: RunConfig; onExit: () => void }) {
  const [attemptNo, setAttemptNo] = useState(0);
  return <Run key={attemptNo} config={config} onExit={onExit} onAgain={() => setAttemptNo((n) => n + 1)} />;
}

function Run({ config, onExit, onAgain }: { config: RunConfig; onExit: () => void; onAgain: () => void }) {
  const piano = usePiano();
  const setup = useMemo(() => {
    const seed = config.seed ?? randomSeed();
    const [pool, rng] = buildPool(config.classIds, seed);
    const records = totals();
    const kinds = [...new Set(pool.map((p) => p.step.kind))];
    return { pool, records, kinds, start: newRun({ poolSize: pool.length, seed: rng, hard: config.hard, records, kinds }) };
  }, [config]);
  const { pool, records, kinds } = setup;
  const [s, setS] = useState<RunState>(setup.start);
  const [saved, setSaved] = useState<Saved | null>(null);
  const savedOnce = useRef(false);
  const previousBest = useMemo(() => recordOf(config.id).best, [config.id]);

  const over = s.phase === 'lost' || s.phase === 'won';
  useEffect(() => {
    if (!over || savedOnce.current) return;
    savedOnce.current = true;
    stopAllSound();
    setSaved(saveRun(config.id, { score: s.score, won: s.phase === 'won', bestStreak: s.bestStreak }, { daily: config.daily, classId: config.hard ? undefined : config.classId }));
  }, [over, s, config]);

  const entry = pool[currentIndex(s)];
  const step = useMemo(() => (entry ? applyTwists(entry.step, s.taken) : null), [entry, s.taken]);
  const stepKey = `${s.round}-${s.at}-${s.stepsPlayed}`;

  // Never let a step's sound run into the next one.
  useEffect(() => () => stopAllSound(), [stepKey]);

  const onAttempt = (ok: boolean) => step && setS((cur) => attempt(cur, ok, step.kind === 'info' ? 'play' : step.kind));
  const onDone = () => setS((cur) => stepDone(cur, pool.length, records, kinds));
  const giveUp = () => setS((cur) => skipStep(cur, pool.length, records, kinds));

  const hud = (
    <div className="run-hud" aria-live="polite">
      <span className="run-hearts" aria-label={`${s.hearts} hearts`}>
        {Array.from({ length: Math.max(s.maxHearts, s.hearts) }, (_, i) => (
          <span key={i} className={i < s.hearts ? 'heart' : 'heart lost'}>♥</span>
        ))}
        {s.shield && <span className="run-shield" title="Shield: your next lost heart is saved">◈</span>}
      </span>
      <span><small>Score</small> <strong>{s.score}</strong></span>
      <span><small>Streak</small> <strong>{s.streak}</strong>{streakMultiplier(s.streak) > 1 && <em> ×{fmt(streakMultiplier(s.streak))}</em>}</span>
      <span><small>Round</small> <strong>{Math.min(s.round + 1, s.rounds)}/{s.rounds}</strong></span>
      {s.taken.some((id) => pickById(id)?.kind === 'twist') && (
        <span className="run-twists">
          {s.taken.filter((id) => pickById(id)?.kind === 'twist').map((id) => <span key={id} className="badge hot">{pickById(id)?.title}</span>)}
          <em>×{fmt(multiplier(s.taken))}</em>
        </span>
      )}
    </div>
  );

  if (over) {
    const won = s.phase === 'won';
    return (
      <section className="card run-end" data-testid="run-end">
        <p className="eyebrow">{config.title}</p>
        <h2>{won ? 'Run cleared!' : 'Out of hearts'}</h2>
        <p className="run-big">{s.score}</p>
        <p className="muted">
          {saved?.isBest ? (previousBest > 0 ? `New best! (before: ${previousBest})` : 'Your first score on this run.') : `Best: ${saved?.record.best ?? previousBest}`}
        </p>
        <ul className="run-stats">
          <li>Rounds: {won ? s.rounds : s.round} of {s.rounds} cleared</li>
          <li>Steps without a mistake: {s.cleanSteps} of {s.stepsPlayed}</li>
          <li>Longest streak: {s.bestStreak}</li>
        </ul>
        {saved && saved.unlocked.length > 0 && (
          <div className="hint-box run-unlocks">
            <strong>Unlocked</strong>
            <ul>{saved.unlocked.map((u) => <li key={u}>{u}</li>)}</ul>
          </div>
        )}
        <div className="row">
          {!config.daily && <button className="primary" onClick={onAgain}><RestartIcon /> New run</button>}
          {config.daily && <button className="primary" onClick={onAgain}><RestartIcon /> Try today’s run again</button>}
          <button onClick={onExit}>All runs</button>
        </div>
      </section>
    );
  }

  if (s.phase === 'pick') {
    return (
      <section className="card run-pick">
        {hud}
        <h2>Round {s.round + 1} cleared</h2>
        <p className="explain">Pick one for the rest of the run. Twists make it harder and every point counts more; perks help.</p>
        <div className="run-offers">
          {s.offers.map((id) => {
            const p = pickById(id)!;
            return (
              <button key={id} className={`run-offer ${p.kind}`} onClick={() => setS((cur) => choosePick(cur, id, pool.length))}>
                <span className="run-offer-kind">{p.kind === 'twist' ? `Twist · ×${fmt(p.mult ?? 1)} points` : 'Perk'}</span>
                <strong>{p.title}</strong>
                <span>{p.description}</span>
              </button>
            );
          })}
        </div>
        <p><button className="ghost" onClick={() => setS((cur) => choosePick(cur, null, pool.length))}>Take nothing <ArrowRightIcon /></button></p>
      </section>
    );
  }

  return (
    <section className="card guide run">
      <div className="step-head">{hud}</div>
      <div className="guide-body">
        {!piano.connected && <p className="hint-box">No keyboard connected: you can click the on-screen keys, but runs are made for your piano.</p>}
        <p className="run-from muted">Step {s.at + 1} of {s.queue.length} · from <em>{entry.from}</em></p>
        {step && <StepView key={stepKey} step={step} onAttempt={onAttempt} onDone={onDone} />}
      </div>
      <div className="guide-controls">
        <button className="ghost" onClick={onExit}>Quit run</button>
        <span className="spacer" />
        <button className="ghost" onClick={giveUp} title="Move on; costs a heart unless this step already cost one">
          Give up this step (−♥) <ArrowRightIcon />
        </button>
      </div>
    </section>
  );
}
