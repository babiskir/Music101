import { useMemo, useRef, useState } from 'react';
import { getAudioContext } from '../audio/audioContext';
import { playNote } from '../audio/sounds';
import { midiToPitch } from '../domain/notes';
import type { TimedNote } from '../domain/song';
import { StaffNotation } from '../features/staff/StaffNotation';
import { cue } from './feedback';
import { labelsFor } from './labels';
import type { ChooseStep } from './types';

const DONE_PAUSE_MS = 900;
const NOTE_GAP_S = 0.55;

interface Props {
  step: ChooseStep;
  onDone: () => void;
  onAttempt: (ok: boolean) => void;
}

/** "Higher or lower?": look (and listen), then tap the right answer. Works with mouse or touch, no piano needed. */
export function ChooseStepView({ step, onDone, onAttempt }: Props) {
  const [choices] = useState(() => (typeof step.choices === 'function' ? step.choices() : step.choices));
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const timer = useRef<number | null>(null);

  const choice = choices[Math.min(index, choices.length - 1)];

  const notes = useMemo<TimedNote[] | null>(
    () => (choice.notes?.length ? choice.notes.map((m, i) => ({ pitch: midiToPitch(m), beats: 1, startBeat: i })) : null),
    [choice],
  );
  const labels = useMemo(
    () => (choice.notes ? labelsFor(choice.notes, choice.labels, choice.solfege) : undefined),
    [choice],
  );

  const hear = () => {
    const t = getAudioContext().currentTime;
    choice.notes?.forEach((m, i) => playNote(m, t + i * NOTE_GAP_S, 0.5));
  };

  const answer = (i: number) => {
    if (done) return;
    const ok = i === choice.answer;
    onAttempt(ok);
    if (!ok) {
      cue('wrong');
      setWrong(i);
      setMessage(choice.hint ? `Not quite. ${choice.hint}` : 'Not quite. Look again and try another.');
      return;
    }
    setWrong(null);
    setMessage(null);
    if (index + 1 >= choices.length) {
      setDone(true);
      cue('done');
      timer.current = window.setTimeout(onDone, DONE_PAUSE_MS);
    } else {
      cue('ok');
      setIndex(index + 1);
    }
  };

  return (
    <div className="choose-step" data-testid="choose-step" data-index={index} data-answer={choice.answer}>
      <h2>{step.title}</h2>
      {step.body && <p className="explain">{step.body}</p>}

      <div className="prompt-card">
        <p className="prompt">{done ? 'Well done!' : choice.prompt}</p>
        {notes && (
          <div className="staff-narrow">
            <StaffNotation
              notes={notes}
              beatsPerBar={notes.length}
              activeIndex={-1}
              maxBarsPerLine={1}
              timeSignature={false}
              labels={labels}
            />
          </div>
        )}
        {notes && (
          <button onClick={hear} className="hear">
            🔊 Hear it
          </button>
        )}
        <div className="answers choices">
          {choice.options.map((option, i) => (
            <button key={option} className={wrong === i ? 'wrong' : ''} onClick={() => answer(i)} disabled={done}>
              {option}
            </button>
          ))}
        </div>
        <div className="dots" aria-hidden="true">
          {choices.map((_, i) => (
            <span key={i} className={`dot2${i < index || done ? ' done' : ''}${i === index && !done ? ' current' : ''}`} />
          ))}
        </div>
      </div>

      <p className="feedback-line" aria-live="polite">
        {done ? '✓ Done' : message ?? ' '}
      </p>
    </div>
  );
}
