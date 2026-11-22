import { useState } from 'react';
import { getAudioContext } from '../../audio/audioContext';
import { playNote } from '../../audio/sounds';
import { CT_S100 } from '../../domain/instrument';
import { Keyboard, type KeyHighlight } from '../../features/keyboard/Keyboard';
import { usePlayedKey } from '../../input/PianoInput';

type Mode =
  | { kind: 'groups' }
  | { kind: 'middle' }
  | { kind: 'letter'; pc: number; name: string };

const LETTERS = [
  { name: 'C', pc: 0 }, { name: 'D', pc: 2 }, { name: 'E', pc: 4 }, { name: 'F', pc: 5 },
  { name: 'G', pc: 7 }, { name: 'A', pc: 9 }, { name: 'B', pc: 11 },
];

const MIDDLE_C = 60;

function instruction(mode: Mode): string {
  switch (mode.kind) {
    case 'groups':
      return 'Black keys come in groups of 2 (orange) and 3 (blue). Use them as landmarks, so you never have to count white keys.';
    case 'middle':
      return 'Middle C is the C closest to the middle of the keyboard, the white key just left of a group of 2 black keys. Most beginner songs start near here.';
    case 'letter':
      return mode.name === 'C'
        ? 'Every C is the white key just left of a group of 2 black keys.'
        : mode.name === 'F'
          ? 'Every F is the white key just left of a group of 3 black keys.'
          : `All the ${mode.name}s on your keyboard. Find one on the real CT-S100 by using the black-key groups as landmarks.`;
  }
}

/** Layout: big full-width 61-key keyboard on top, exercise tabs + explanation underneath. */
export function KeyboardBasics() {
  const [mode, setMode] = useState<Mode>({ kind: 'groups' });

  const highlights: Record<number, KeyHighlight> = {};
  for (let m = CT_S100.lowest; m <= CT_S100.highest; m++) {
    const pc = m % 12;
    if (mode.kind === 'groups') {
      if (pc === 1 || pc === 3) highlights[m] = { kind: 'current' };
      else if (pc === 6 || pc === 8 || pc === 10) highlights[m] = { kind: 'next' };
    } else if (mode.kind === 'middle') {
      if (m === MIDDLE_C) highlights[m] = { kind: 'current', label: '★' };
    } else if (pc === mode.pc) {
      highlights[m] = { kind: 'current' };
    }
  }

  const played = usePlayedKey();
  if (played !== null) highlights[played] = { kind: 'correct' }; // the key you just played on your keyboard

  const hear = (midi: number) => playNote(midi, getAudioContext().currentTime, 0.8);

  return (
    <section className="card">
      <h2>Meet the keyboard <small>all 61 keys, C2 to C6</small></h2>
      <Keyboard from={CT_S100.lowest} to={CT_S100.highest} highlights={highlights} onKeyPress={hear} />

      <div className="tabs" role="tablist">
        <button className={mode.kind === 'groups' ? 'selected' : ''} onClick={() => setMode({ kind: 'groups' })}>
          Black-key groups
        </button>
        <button className={mode.kind === 'middle' ? 'selected' : ''} onClick={() => setMode({ kind: 'middle' })}>
          Middle C
        </button>
        <span className="tabs-sep">Find every…</span>
        {LETTERS.map((l) => (
          <button
            key={l.name}
            className={mode.kind === 'letter' && mode.pc === l.pc ? 'selected' : ''}
            onClick={() => setMode({ kind: 'letter', ...l })}
          >
            {l.name}
          </button>
        ))}
      </div>

      <p className="explain">{instruction(mode)}</p>
      <p className="muted">
        The CT-S100 has 5 octaves. Notes repeat every 12 keys, so once you know the 12 keys of one octave, you know the whole keyboard.
      </p>
    </section>
  );
}
