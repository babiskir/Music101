import { useEffect, useRef, useState } from 'react';
import { getAudioContext } from '../../audio/audioContext';
import { playNote } from '../../audio/sounds';
import { isBlackKey, midiToPitch } from '../../domain/notes';
import type { TimedNote } from '../../domain/song';
import { Keyboard, type KeyHighlight } from '../../features/keyboard/Keyboard';
import { StaffNotation } from '../../features/staff/StaffNotation';

const MIDDLE_C = 60;
const LEVELS = {
  'C to G (5 notes)': 67,
  'C to C (full octave)': 72,
} as const;
type Level = keyof typeof LEVELS;

function pickNote(top: number, avoid: number | null): number {
  const pool: number[] = [];
  for (let m = MIDDLE_C; m <= top; m++) if (!isBlackKey(m) && m !== avoid) pool.push(m);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Layout: staff on the left, keyboard below it, score on the right. Stacks on narrow screens. */
export function ReadingNotes() {
  const [level, setLevel] = useState<Level>('C to G (5 notes)');
  const top = LEVELS[level];
  const [target, setTarget] = useState(() => pickNote(top, null));
  const [feedback, setFeedback] = useState<{ midi: number; ok: boolean } | null>(null);
  const [score, setScore] = useState({ right: 0, tries: 0 });
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const changeLevel = (l: Level) => {
    setLevel(l);
    setTarget(pickNote(LEVELS[l], null));
    setFeedback(null);
  };

  const press = (midi: number) => {
    playNote(midi, getAudioContext().currentTime, 0.7);
    if (feedback?.ok) return; // already answered, waiting for next note
    const ok = midi === target;
    setFeedback({ midi, ok });
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), tries: s.tries + 1 }));
    if (ok) {
      timer.current = window.setTimeout(() => {
        setTarget((t) => pickNote(top, t));
        setFeedback(null);
      }, 900);
    }
  };

  const note: TimedNote = { pitch: midiToPitch(target), beats: 4, startBeat: 0 };
  const highlights: Record<number, KeyHighlight> = {};
  if (feedback) highlights[feedback.midi] = { kind: feedback.ok ? 'correct' : 'wrong' };

  return (
    <div className="reading-layout">
      <section className="card reading-main">
        <h2>Reading notes <small>click the key that matches the note</small></h2>
        <div className="staff-narrow">
          <StaffNotation notes={[note]} beatsPerBar={4} activeIndex={-1} maxBarsPerLine={1} />
        </div>
        <Keyboard from={MIDDLE_C} to={top} highlights={highlights} onKeyPress={press} />
        <p className="explain feedback">
          {feedback === null && 'Which key is this note?'}
          {feedback?.ok && `Correct! That's ${note.pitch}.`}
          {feedback && !feedback.ok && `Not quite: you pressed ${midiToPitch(feedback.midi)}. Try again.`}
        </p>
      </section>

      <aside className="card reading-side">
        <h3>Score</h3>
        <p className="score">{score.right} <span className="muted">/ {score.tries} tries</span></p>
        <label>
          Notes{' '}
          <select value={level} onChange={(e) => changeLevel(e.target.value as Level)}>
            {(Object.keys(LEVELS) as Level[]).map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <h3>Cheat sheet</h3>
        <ul>
          <li>Notes sit on lines or in spaces; higher on the staff = higher on the keyboard.</li>
          <li>Middle C (C4) sits on its own little line <em>below</em> the staff.</li>
          <li>Bottom line to top line: <strong>E G B D F</strong> ("Every Good Boy Does Fine").</li>
          <li>Spaces, bottom to top: <strong>F A C E</strong>.</li>
        </ul>
        <button onClick={() => setScore({ right: 0, tries: 0 })}>Reset score</button>
      </aside>
    </div>
  );
}
