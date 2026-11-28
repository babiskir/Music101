import { useEffect, useMemo, useRef, useState } from 'react';
import { playNow } from '../audio/sounds';
import { CT_S100 } from '../domain/instrument';
import { bothClassNames, midiToPitch } from '../domain/notes';
import { FINGER_NAMES, type TimedNote } from '../domain/song';
import { Keyboard, type KeyHighlight } from '../features/keyboard/Keyboard';
import { rangeForNotes } from '../features/keyboard/range';
import { StaffNotation } from '../features/staff/StaffNotation';
import { useRecentKeys } from '../features/staff/useRecentKeys';
import { usePiano, usePianoNotes } from '../input/PianoInput';
import { useTimers } from '../lib/useTimers';
import { CheckIcon } from '../app/icons';
import { cue, isCueActive, speak } from './feedback';
import { labelsFor } from './labels';
import { accepts, keysAccepting } from './targets';
import { TOGETHER_MS, TogetherJudge } from './together';
import type { PlayStep, Target } from './types';

interface Props {
  step: PlayStep;
  /** Called a moment after the last target was played. */
  onDone: (result: { mistakes: number }) => void;
  /** Called for every key press that was judged (for the all-time accuracy). */
  onAttempt: (ok: boolean) => void;
}

const DONE_PAUSE_MS = 1000;

/** The note a target is named by: its key, or the melody note of several keys together. */
const melodyOf = (t: Target): number => t.midi ?? t.ref ?? Math.max(...(t.keys ?? [60]));

/**
 * "Play this" step. Two looks, same logic:
 *  - quiz cards (targets with a `present`): one prompt at a time, as a note name or a note on the staff;
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
  const { later } = useTimers();
  // Both hands at once: which keys of the current target are already down.
  const recent = useRecentKeys();
  const judge = useRef<TogetherJudge | null>(null);
  const [found, setFound] = useState<number[]>([]);

  const show = step.show ?? {};
  const isCard = targets.some((t) => t.present);
  const current = targets[Math.min(index, targets.length - 1)];

  const [from, to] = useMemo<[number, number]>(() => {
    if (step.keyboard) return step.keyboard;
    const refs = targets.flatMap((t) => (t.ref !== undefined ? [t.ref] : t.midi !== undefined ? [t.midi] : []));
    return refs.length ? rangeForNotes(refs, CT_S100) : [CT_S100.lowest, CT_S100.highest];
  }, [step, targets]);

  /** Keys on the on-screen keyboard that would be right for a target. */
  const acceptedKeys = (t: Target) => keysAccepting(t, from, to);

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


  const handle = (midi: number, fromPiano: boolean, timeMs: number) => {
    if (done) return;
    // A microphone could pick up our own chime or voice: ignore presses right after those.
    if (fromPiano && piano.source === 'mic' && isCueActive()) return;
    let ok: boolean;
    if (current.keys) {
      // USB hears both hands at once; the microphone and the mouse can only give one key at a time.
      judge.current ??= new TogetherJudge(current.keys);
      const result = judge.current.press(midi, timeMs, fromPiano && piano.source === 'midi' ? TOGETHER_MS : Infinity);
      setFound(judge.current.found);
      if (result === 'partial') return;
      ok = result === 'complete';
    } else {
      ok = accepts(current, midi);
    }
    onAttempt(ok);
    if (ok) {
      judge.current = null;
      setFound([]);
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
      setMessage(`That was ${bothClassNames(midi % 12)}. Try again.`);
      later(() => setWrongKey(null), 600);
    }
  };

  usePianoNotes((e) => handle(e.midi, true, e.time));
  const clickKey = (midi: number) => {
    playNow(midi);
    recent.press(midi);
    handle(midi, false, performance.now());
  };

  // --- keyboard highlights
  const highlights: Record<number, KeyHighlight> = {};
  if (!done) {
    const label = (t: Target) => (show.fingers && t.finger ? FINGER_NAMES[t.finger] : undefined);
    if (show.keys || hinted) for (const k of acceptedKeys(current)) highlights[k] = { kind: 'current', label: label(current) };
    const next = targets[index + 1];
    const nextKeys = next ? (next.keys ?? (next.midi !== undefined ? [next.midi] : [])) : [];
    if (show.keys) for (const k of nextKeys) if (!highlights[k]) highlights[k] = { kind: 'next', label: label(next) };
    for (const k of found) highlights[k] = { kind: 'correct' };
  }
  if (wrongKey !== null) highlights[wrongKey] = { kind: 'wrong' };

  // --- sheet music for a whole sequence (songs, runs)
  const timed = useMemo<TimedNote[] | null>(() => {
    if (!show.staff || isCard || !targets.every((t) => t.midi !== undefined || t.keys)) return null;
    let at = 0;
    return targets.map((t) => {
      const main = melodyOf(t);
      const also = t.keys?.filter((k) => k !== main).map(midiToPitch);
      const n: TimedNote = { pitch: midiToPitch(main), also, beats: t.beats ?? 1, startBeat: at }; // no finger numbers on the sheet
      at += n.beats;
      return n;
    });
  }, [show.staff, isCard, targets]);

  const timedLabels = useMemo(
    () => (timed ? labelsFor(targets.map(melodyOf), show.labels) : undefined),
    [timed, targets, show.labels],
  );

  // --- a single note on the staff (quiz card)
  const cardNote: TimedNote[] | null =
    isCard && current.present === 'staff' && current.midi !== undefined
      ? [{ pitch: midiToPitch(current.midi), beats: 4, startBeat: 0 }]
      : null;
  // On a card, "first" means: only the first prompt of the round shows its name.
  const cardLabels =
    cardNote && current.midi !== undefined
      ? labelsFor([current.midi], index === 0 || show.labels === 'all' ? show.labels : 'none')
      : undefined;

  const accepted = done ? [] : acceptedKeys(current);

  return (
    <div className="play-step" data-testid="play-step" data-index={index} data-expect={accepted.join(',')}>
      <h2>{step.title}</h2>
      {step.body && <p className="explain">{step.body}</p>}
      {current.keys && piano.source === 'mic' && !done && (
        <p className="hint-box">The microphone hears one note at a time: play the keys one after the other. Over USB, play them together.</p>
      )}

      {isCard ? (
        <div className="prompt-card">
          {current.present === 'name' && <div className="big-note" aria-label="Play this note">{current.label}</div>}
          {cardNote && (
            <div className="staff-narrow">
              <StaffNotation notes={cardNote} beatsPerBar={4} activeIndex={-1} maxBarsPerLine={1} timeSignature={false} labels={cardLabels} clef={current.clef} glow={recent.keys} />
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
            <StaffNotation notes={timed} beatsPerBar={step.beatsPerBar ?? 4} activeIndex={done ? -1 : index} labels={timedLabels} clef={show.clef} glow={recent.keys} />
          )}
        </>
      )}

      <Keyboard from={from} to={to} highlights={highlights} onKeyPress={clickKey} showNames={step.names ?? true} />

      <p
        className={`feedback-line${done ? ' is-done' : message ? ' is-wrong' : hinted && current.hint ? ' is-hint' : ''}`}
        aria-live="polite"
      >
        {done ? (
          <><CheckIcon /> {mistakes === 0 ? 'Clean, no slips.' : 'Done, with a few slips.'}</>
        ) : message ? (
          message
        ) : hinted && current.hint ? (
          <><strong>Hint</strong> {current.hint}</>
        ) : (
          ' '
        )}
      </p>
    </div>
  );
}
