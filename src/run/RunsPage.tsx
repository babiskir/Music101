import { classes, lessonsOf } from '../lessons/classes';
import { useProgress } from '../lessons/progress';
import type { PageProps } from '../pages/types';
import { PICKS } from './modifiers';
import { hardUnlocked, loadRecords, recordOf, totals } from './records';
import { seedFrom, todayKey } from './rng';
import type { RunConfig } from './RunScreen';

/** The classes the daily run draws from: every class you started (at least one lesson done), or the first. */
export function dailyConfig(done: string[]): RunConfig {
  const started = classes.filter((c) => c.lessonIds.some((id) => done.includes(id)));
  const pool = started.length ? started : classes.slice(0, 1);
  const date = todayKey();
  return { id: 'daily', title: `Daily run · ${date}`, classIds: pool.map((c) => c.id), seed: seedFrom(`daily ${date} ${pool.map((c) => c.id).join()}`), daily: date };
}

export function classRunConfig(classId: string, hard: boolean): RunConfig {
  const c = classes.find((x) => x.id === classId)!;
  return { id: hard ? `${c.id}-hard` : c.id, title: `${c.title}${hard ? ' · hard' : ''}`, classIds: [c.id], hard, classId: c.id };
}

/** All practice runs: today's daily run, then a run (and, once won, a hard run) for each class. */
export function RunsPage({ openPage }: PageProps) {
  const { done } = useProgress();
  const all = loadRecords();
  const t = totals(all);
  const daily = dailyConfig(done);
  const todayBest = all.daily[daily.daily!] ?? 0;
  const locked = PICKS.filter((p) => p.unlock && !(t.runs >= (p.unlock.runs ?? 0) && t.wins >= (p.unlock.wins ?? 0)));

  return (
    <section className="card">
      <p className="eyebrow">Practice runs</p>
      <h2>Runs</h2>
      <p className="explain">
        Each run is new: five rounds of exercises drawn at random from a class, plus exercises made up on the spot.
        You have three hearts; a step with a mistake costs one. Keep a streak going for more points, and after every
        round pick a twist (harder, more points) or a perk.
      </p>

      <article className="run-tile daily">
        <div>
          <h3>Daily run</h3>
          <p className="muted">The same run all day, from {daily.classIds.length === 1 ? 'the class' : `the ${daily.classIds.length} classes`} you have started. Today’s best: {todayBest || '—'}</p>
        </div>
        <button className="primary" onClick={() => openPage('run-daily')}>Play today’s run</button>
      </article>

      <div className="run-grid">
        {classes.map((c, i) => {
          const r = recordOf(c.id, all);
          const hard = recordOf(`${c.id}-hard`, all);
          const open = hardUnlocked(c.id, all);
          const lessonsDone = lessonsOf(c).filter((l) => done.includes(l.id)).length;
          return (
            <article key={c.id} className="run-tile">
              <p className="eyebrow">Class {i + 1}</p>
              <h3>{c.title}</h3>
              <p className="muted">{lessonsDone} of {c.lessonIds.length} lessons done · {r.runs ? `best ${r.best}, won ${r.wins} of ${r.runs}` : 'no runs yet'}</p>
              <div className="row">
                <button className="primary" onClick={() => openPage(`run-${c.id}`)}>Run</button>
                <button disabled={!open} onClick={() => openPage(`run-${c.id}-hard`)} title={open ? 'Starts with No names and two hearts' : 'Win a normal run of this class first'}>
                  {open ? `Hard${hard.runs ? ` · best ${hard.best}` : ''}` : '🔒 Hard'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {locked.length > 0 && (
        <>
          <h3>Still locked</h3>
          <ul className="muted">
            {locked.map((p) => (
              <li key={p.id}>
                {p.title} ({p.kind}): {p.unlock?.wins ? `win ${p.unlock.wins} run${p.unlock.wins > 1 ? 's' : ''}` : `play ${p.unlock?.runs} run${p.unlock?.runs === 1 ? '' : 's'}`}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="muted">Runs played: {t.runs} · won: {t.wins}</p>
    </section>
  );
}
