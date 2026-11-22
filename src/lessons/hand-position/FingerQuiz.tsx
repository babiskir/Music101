import { useState } from 'react';
import { getAudioContext } from '../../audio/audioContext';
import { playNote } from '../../audio/sounds';
import { midiToPitch } from '../../domain/notes';
import { FINGER_NAMES, type Finger } from '../../domain/song';
import { Keyboard, type KeyHighlight } from '../../features/keyboard/Keyboard';
import { useQuiz } from '../useQuiz';
import { FINGERS, POSITIONS, type Hand } from './positions';

type Direction = 'key-to-finger' | 'finger-to-key';

function randomFinger(prev: Finger | null): Finger {
  const pool = FINGERS.filter((f) => f !== prev);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function FingerQuiz({ hand }: { hand: Hand }) {
  const pos = POSITIONS[hand];
  const [direction, setDirection] = useState<Direction>('key-to-finger');
  const quiz = useQuiz<Finger, number>(randomFinger);
  const { target, result, score } = quiz;
  const targetKey = pos.keys[target];

  const hear = (midi: number) => playNote(midi, getAudioContext().currentTime, 0.6);

  const pressKey = (midi: number) => {
    hear(midi);
    if (direction === 'finger-to-key') quiz.answer(midi === targetKey, midi);
  };

  const pickFinger = (f: Finger) => {
    if (direction !== 'key-to-finger') return;
    if (f === target) hear(targetKey);
    quiz.answer(f === target, f);
  };

  const highlights: Record<number, KeyHighlight> = {};
  if (direction === 'key-to-finger') {
    // Show the label only once answered correctly.
    highlights[targetKey] = { kind: result?.ok ? 'correct' : 'current', label: result?.ok ? String(target) : undefined };
  } else if (result) {
    highlights[result.detail] = { kind: result.ok ? 'correct' : 'wrong' };
  }

  const prompt =
    direction === 'key-to-finger' ? (
      <>Which finger plays <strong>{midiToPitch(targetKey)}</strong> (the highlighted key)?</>
    ) : (
      <>Press the key for finger <strong>{target}</strong> ({FINGER_NAMES[target]})</>
    );

  const feedback = !result
    ? ' '
    : result.ok
      ? `Correct: finger ${target} (${FINGER_NAMES[target]}) plays ${midiToPitch(targetKey)}.`
      : direction === 'key-to-finger'
        ? `Not finger ${result.detail}. Count from the thumb and try again.`
        : `That was ${midiToPitch(result.detail)}. Try again.`;

  return (
    <div>
      <div className="tabs">
        <button className={direction === 'key-to-finger' ? 'selected' : ''} onClick={() => { setDirection('key-to-finger'); quiz.restart(); }}>
          Key → finger
        </button>
        <button className={direction === 'finger-to-key' ? 'selected' : ''} onClick={() => { setDirection('finger-to-key'); quiz.restart(); }}>
          Finger → key
        </button>
        <span className="tabs-sep">{score.right} right / {score.tries} tries</span>
      </div>

      <p className="prompt">{prompt}</p>
      <Keyboard from={pos.range[0]} to={pos.range[1]} highlights={highlights} onKeyPress={pressKey} />

      {direction === 'key-to-finger' && (
        <div className="answers">
          {FINGERS.map((f) => (
            <button key={f} onClick={() => pickFinger(f)}>
              {f} <span className="muted">{FINGER_NAMES[f]}</span>
            </button>
          ))}
        </div>
      )}
      <p className="explain feedback">{feedback}</p>
    </div>
  );
}
