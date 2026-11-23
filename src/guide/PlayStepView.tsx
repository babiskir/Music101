import { useEffect, useMemo, useRef, useState } from 'react';
import { getAudioContext } from '../audio/audioContext';
import { playNote } from '../audio/sounds';
import { CT_S100 } from '../domain/instrument';
import { midiToPitch, pitchClassLabel } from '../domain/notes';
import { FINGER_NAMES, type TimedNote } from '../domain/song';
import { Keyboard, type KeyHighlight } from '../features/keyboard/Keyboard';
import { rangeForNotes } from '../features/keyboard/range';
import { StaffNotation } from '../features/staff/StaffNotation';
import { usePiano, usePianoNotes } from '../input/PianoInput';
import { cue, isCueActive, speak } from './feedback';
import { labelsFor } from './labels';
import type { PlayStep, Target } from './types';

interface Props {
  step: PlayStep;
  /** Called a moment after the last target was played. */
  onDone: (result: { mistakes: number }) => void;
  /** Called for every key press that was judged (for the all-time accuracy). */
  onAttempt: (ok: boolean) => void;
}

const DONE_PAUSE_MS = 1000;

const accepts = (t: Target, midi: number) => (t.midi !== undefined ? midi === t.midi : !!t.match && t.match(midi));

/**
 * "Play this" step. Two looks, same logic:
 *  - quiz cards (targets with a `present`): one prompt at a time, as a letter or a note on the staff;
 *  - sequences: a line of things to play, optionally with the sheet music and the key lit up.
 * The player answers on the piano; the on-screen keyboard also works as a fallback.
 */
export function PlayStepView({ step, onDone, onAttempt }: Props) {
  const piano = usePiano();
  const [targets] = useState<Target[]>(() => (typeof step.targets === 'function' ? step.targets() : step.targets));
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongKey, setWrongKey] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hinted, setHinted] = useState(false);
  const [done, setDone] = useState(false);
  const timers = useRef<number[]>([]);

  const show = step.show ?? {};
  const isCard = targets.some((t) => t.present);
  const current = targets[Math.min(index, targets.length - 1)];

  const [from, to] = useMemo<[number, number]>(() => {
    if (step.keyboard) return step.keyboard;
    const refs = targets.flatMap((t) => (t.ref !== undefined ? [t.ref] : t.midi !== undefined ? [t.midi] : []));
    return refs.length ? rangeForNotes(refs, CT_S100) : [CT_S100.lowest, CT_S100.highest];
  }, [step, targets]);

  /** Keys on the on-screen keyboard that would be right for a target. */
  const acceptedKeys = (t: Target) => {
    const keys: number[] = [];
    for (let m = from; m <= to; m++) if (accepts(t, m)) keys.push(m);
    return keys;
  };

  // The hint appears when the player is stuck on a target for a while.
  useEffect(() => {
    setHinted(false);
    const id = window.setTimeout(() => setHinted(true), step.hintAfterMs ?? 10000);
    return () => window.clearTimeout(id);
  }, [index, step.hintAfterMs]);

  // Say what to do (only if spoken instructions are on).
  useEffect(() => {
    const t = targets[index];
    if (t && t.spoken) speak(t.spoken);
  }, [index, targets]);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const handle = (midi: number, fromPiano: boolean) => {
    if (done) return;
    // A microphone could pick up our own chime or voice: ignore presses right after those.
    if (fromPiano && piano.source === 'mic' && isCueActive()) return;
    const ok = accepts(current, midi);
    onAttempt(ok);
    if (ok) {
      setMessage(null);
      if (index + 1 >= targets.length) {
        setDone(true);
        cue('done');
        later(() => onDone({ mistakes }), DONE_PAUSE_MS);
      } else {
        cue('ok');
        setIndex(index + 1);
      }
    } else {
      cue('wrong');
      setMistakes((m) => m + 1);
      setWrongKey(midi);
      setMessage(`That was ${pitchClassLabel(midi % 12)}. Try again.`);
      later(() => setWrongKey(null), 600);
    }
  };

  usePianoNotes((e) => handle(e.midi, true));
  const clickKey = (midi: number) => {
    playNote(midi, getAudioContext().currentTime, 0.6);
    handle(midi, false);
  };

  // --- keyboard highlights
  const highlights: Record<number, KeyHighlight> = {};
  if (!done) {
    const label = (t: Target) => (show.fingers && t.finger ? FINGER_NAMES[t.finger] : undefined);
    if (show.keys || hinted) for (const k of acceptedKeys(current)) highlights[k] = { kind: 'current', label: label(current) };
    const next = targets[index + 1];
    if (show.keys && next && next.midi !== undefined && !highlights[next.midi]) {
      highlights[next.midi] = { kind: 'next', label: label(next) };
    }
  }
  if (wrongKey !== null) highlights[wrongKey] = { kind: 'wrong' };

  // --- sheet music for a whole sequence (songs, runs)
  const timed = useMemo<TimedNote[] | null>(() => {
    if (!show.staff || isCard || !targets.every((t) => t.midi !== undefined)) return null;
    let at = 0;
    return targets.map((t) => {
      const n: TimedNote = { pitch: midiToPitch(t.midi!), beats: t.beats ?? 1, startBeat: at }; // no finger numbers on the sheet
      at += n.beats;
      return n;
    });
  }, [show.staff, isCard, targets]);

  const timedLabels = useMemo(
    () => (timed ? labelsFor(targets.map((t) => t.midi!), show.labels, show.solfege) : undefined),
    [timed, targets, show.labels, show.solfege],
  );

  // --- a single note on the staff (quiz card)
  const cardNote: TimedNote[] | null =
    isCard && current.present === 'staff' && current.midi !== undefined
      ? [{ pitch: midiToPitch(current.midi), beats: 4, startBeat: 0 }]
      : null;
  // On a card, "first" means: only the first prompt of the round shows its letter.
  const cardLabels =
    cardNote && current.midi !== undefined
      ? labelsFor([current.midi], index === 0 || show.labels === 'all' ? show.labels : 'none', show.solfege)
      : undefined;

  const accepted = done ? [] : acceptedKeys(current);

  return (
    <div className="play-step" data-testid="play-step" data-index={index} data-expect={accepted.join(',')}>
      <h2>{step.title}</h2>
      {step.body && <p className="explain">{step.body}</p>}

      {isCard ? (
        <div className="prompt-card">
          {current.present === 'name' && <div className="big-note" aria-label="Play this note">{current.label}</div>}
          {cardNote && (
            <div className="staff-narrow">
              <StaffNotation notes={cardNote} beatsPerBar={4} activeIndex={-1} maxBarsPerLine={1} timeSignature={false} labels={cardLabels} />
            </div>
          )}
          <div className="dots" aria-hidden="true">
            {targets.map((_, i) => (
              <span key={i} className={`dot2${i < index || done ? ' done' : ''}${i === index && !done ? ' current' : ''}`} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <p className="prompt">{done ? 'Well done!' : current.label}</p>
          {targets.length <= 16 && (
            <div className="drill-seq" aria-label="Sequence">
              {targets.map((t, i) => (
                <span key={i} className={`seq-chip${i < index || done ? ' done' : ''}${i === index && !done ? ' current' : ''}`}>
                  {t.chip ?? '•'}
                </span>
              ))}
            </div>
          )}
          {timed && (
            <StaffNotation notes={timed} beatsPerBar={step.beatsPerBar ?? 4} activeIndex={done ? -1 : index} labels={timedLabels} />
          )}
        </>
      )}

      <Keyboard from={from} to={to} highlights={highlights} onKeyPress={clickKey} showNames={step.names ?? true} />

      <p className="feedback-line" aria-live="polite">
        {done
          ? mistakes === 0
            ? '✓ Clean!'
            : '✓ Done, with a few slips'
          : message ?? (hinted && current.hint ? `Hint: ${current.hint}` : ' ')}
      </p>
    </div>
  );
}
