import { useEffect, useState } from 'react';
import { getAudioContext } from '../../audio/audioContext';
import { playNote } from '../../audio/sounds';
import { describePitch, isBlackKey, pitchClassLabel } from '../../domain/notes';
import { Keyboard, type KeyHighlight } from '../../features/keyboard/Keyboard';
import { usePianoNotes } from '../../input/PianoInput';
import { isBoolean, oneOf } from '../../lib/storage';
import { formatLifetime } from '../../lib/useLifetimeStats';
import { usePersistentState } from '../../lib/usePersistentState';
import { useQuiz } from '../useQuiz';

type Mode = 'name-to-key' | 'key-to-name';

const RANGES = {
  'One octave (C4–C5)': [60, 72],
  'Two octaves (C3–C5)': [48, 72],
  'Whole keyboard (C2–C6)': [36, 96],
} as const;
type RangeName = keyof typeof RANGES;

/** The landmark trick for each pitch class. */
const LANDMARKS: Record<number, string> = {
  0: 'C is the white key just LEFT of a pair of black keys.',
  1: 'C#/Db is the FIRST black key of the pair (just right of C).',
  2: 'D is the white key BETWEEN the two black keys of a pair.',
  3: 'D#/Eb is the SECOND black key of the pair.',
  4: 'E is the white key just RIGHT of a pair of black keys.',
  5: 'F is the white key just LEFT of a group of three black keys.',
  6: 'F#/Gb is the FIRST black key of the group of three.',
  7: 'G is the white key between the 1st and 2nd black keys of the three.',
  8: 'G#/Ab is the MIDDLE black key of the three.',
  9: 'A is the white key between the 2nd and 3rd black keys of the three.',
  10: 'A#/Bb is the LAST black key of the three.',
  11: 'B is the white key just RIGHT of a group of three black keys.',
};

function randomNote(range: readonly [number, number], sharps: boolean, prev: number | null): number {
  const pool: number[] = [];
  for (let m = range[0]; m <= range[1]; m++) {
    if (m !== prev && (sharps || !isBlackKey(m))) pool.push(m);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Layout: big prompt on top, full-width keyboard, answer buttons / hint underneath.
 * Two directions: name -> click the key, and highlighted key -> name it.
 */
export function FindTheKey() {
  const [mode, setMode] = usePersistentState<Mode>('find.mode', 'name-to-key', oneOf('name-to-key', 'key-to-name'));
  const [rangeName, setRangeName] = usePersistentState<RangeName>(
    'find.range',
    'One octave (C4–C5)',
    oneOf(...(Object.keys(RANGES) as RangeName[])),
  );
  const [sharps, setSharps] = usePersistentState('find.sharps', false, isBoolean);
  const [hintFor, setHintFor] = useState<number | null>(null);
  const range = RANGES[rangeName];

  const quiz = useQuiz<number, number>((prev) => randomNote(range, sharps, prev), 'find-the-key');
  const { target, result, score } = quiz;

  // New question when the settings change.
  useEffect(() => {
    quiz.restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, rangeName, sharps]);

  const hear = (midi: number) => playNote(midi, getAudioContext().currentTime, 0.7);

  const pressKey = (midi: number, fromPiano = false) => {
    if (!fromPiano) hear(midi); // the real keyboard makes its own sound
    if (mode === 'name-to-key') quiz.answer(midi === target, midi);
  };

  usePianoNotes((e) => pressKey(e.midi, true));

  const pressName = (pc: number) => quiz.answer(pc === target % 12, pc);

  const highlights: Record<number, KeyHighlight> = {};
  if (mode === 'key-to-name') highlights[target] = { kind: 'current' };
  if (mode === 'name-to-key' && result) {
    highlights[result.detail] = { kind: result.ok ? 'correct' : 'wrong' };
  }

  const names: number[] = [];
  for (let pc = 0; pc < 12; pc++) if (sharps || ![1, 3, 6, 8, 10].includes(pc)) names.push(pc);

  const prompt =
    mode === 'name-to-key' ? (
      <>Find <strong>{describePitch(target)}</strong></>
    ) : (
      <>What is the <strong>highlighted key</strong> called?</>
    );

  const feedback = !result
    ? ' '
    : result.ok
      ? `Correct! That's ${describePitch(target)}.`
      : mode === 'name-to-key'
        ? 'Not that one. Use the landmarks and try again.'
        : `Not ${pitchClassLabel(result.detail % 12)}. Try again.`;

  return (
    <section className="card">
      <h2>Find the key <small>{score.right} right / {score.tries} tries</small></h2>

      <div className="tabs">
        <button className={mode === 'name-to-key' ? 'selected' : ''} onClick={() => setMode('name-to-key')}>
          Name → key
        </button>
        <button className={mode === 'key-to-name' ? 'selected' : ''} onClick={() => setMode('key-to-name')}>
          Key → name
        </button>
        <span className="tabs-sep" />
        <select value={rangeName} onChange={(e) => setRangeName(e.target.value as RangeName)}>
          {(Object.keys(RANGES) as RangeName[]).map((r) => <option key={r}>{r}</option>)}
        </select>
        <label>
          <input type="checkbox" checked={sharps} onChange={(e) => setSharps(e.target.checked)} /> Include black keys
        </label>
      </div>

      <p className="prompt">{prompt}</p>

      <Keyboard from={range[0]} to={range[1]} highlights={highlights} onKeyPress={(m) => pressKey(m)} />

      {mode === 'key-to-name' && (
        <div className="answers">
          {names.map((pc) => (
            <button key={pc} onClick={() => pressName(pc)}>{pitchClassLabel(pc)}</button>
          ))}
        </div>
      )}

      <p className="explain feedback">{feedback}</p>

      <div className="row">
        <button onClick={() => setHintFor(hintFor === target ? null : target)}>
          {hintFor === target ? 'Hide hint' : 'Show landmark hint'}
        </button>
        <button onClick={quiz.restart}>Skip</button>
        <button onClick={quiz.resetScore}>Reset score</button>
      </div>
      {hintFor === target && <p className="hint-box">{LANDMARKS[target % 12]}</p>}
      <p className="lifetime">{formatLifetime(quiz.lifetime)}</p>
    </section>
  );
}
