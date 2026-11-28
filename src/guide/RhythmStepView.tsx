import { useEffect, useMemo, useRef, useState } from 'react';
import { MetronomeEngine } from '../audio/MetronomeEngine';
import { getAudioContext, onStopAll, stopAllSound } from '../audio/audioContext';
import { playNote } from '../audio/sounds';
import type { TimedNote } from '../domain/song';
import { StaffNotation } from '../features/staff/StaffNotation';
import { usePianoNotes } from '../input/PianoInput';
import { useTimers } from '../lib/useTimers';
import { RestartIcon, SpeakerIcon, StopIcon } from '../app/icons';
import { cue, speak } from './feedback';
import { patternBeats, readPattern, shortestGap, sounding } from './rhythmPattern';
import { scoreRhythm, type RhythmScore } from './rhythmScore';
import type { RhythmStep } from './types';

const RETRY_PAUSE_MS = 2800;
const DONE_PAUSE_MS = 1800;
const DEMO_NOTE = 76; // the pattern is demonstrated on a high, clear note
const DEMO_LEAD_MS = 400;
const DEMO_TAIL_MS = 900;

function message(s: RhythmScore, received: number): string {
  switch (s.status) {
    case 'ok':
      return 'Steady! Every note was on the beat.';
    case 'missing':
      if (received >= s.expected) {
        return `I got ${received} key presses, but only ${s.heard} landed close enough to the pattern to count (the sheet has ${s.expected}). Start on the first note and keep with the click. Trying again…`;
      }
      return `I heard ${s.heard} note${s.heard === 1 ? '' : 's'}, but the sheet has ${s.expected}. Play one key for every note. Trying again…`;
    case 'extra':
      return `I heard ${s.heard} notes, but the sheet has only ${s.expected}. Play one key for every note. Trying again…`;
    case 'uneven':
      return 'A bit uneven: one note was too early or too late. Aim to land exactly on the beat. Trying again…';
  }
}

/**
 * Count-in, then play one key per note, any key, in time with the click. The app grades how evenly
 * you landed on the beats (see scoreRhythm) and repeats until it is steady.
 */
export function RhythmStepView({ step, onDone, onAttempt }: {
  step: RhythmStep;
  onDone: () => void;
  /** Called after every try: steady or not (practice runs count it). */
  onAttempt?: (ok: boolean) => void;
}) {
  const beatsPerBar = step.beatsPerBar ?? 4;
  const spbMs = (60 / step.bpm) * 1000;
  const pattern = useMemo(() => readPattern(step.beats), [step]);
  const notes = useMemo<TimedNote[]>(
    () => pattern.map((n) => ({ pitch: 'B4', beats: n.beats, startBeat: n.start, rest: n.rest })),
    [pattern],
  );
  const totalBeats = patternBeats(step.beats);
  const minGap = shortestGap(pattern);

  const [phase, setPhase] = useState<'ready' | 'listening' | 'running' | 'result' | 'stopped'>('ready');
  const [count, setCount] = useState<number | null>(null);
  const [active, setActive] = useState(-1);
  const [score, setScore] = useState<RhythmScore | null>(null);
  const [received, setReceived] = useState(0); // every key press during the attempt, even ones too far from the pattern
  const run = useRef({ onsets: [] as number[], expected: [] as number[], phase: 'ready' as string });
  const engine = useRef<MetronomeEngine | null>(null);
  const timers = useTimers();
  const { later } = timers;

  usePianoNotes((e) => {
    if (run.current.phase === 'running') run.current.onsets.push(e.time);
  });

  const finish = () => {
    engine.current?.stop();
    const result = scoreRhythm(run.current.expected, run.current.onsets, spbMs, minGap);
    run.current.phase = 'result';
    setPhase('result');
    setReceived(run.current.onsets.length);
    // Handy when something seems off: press F12 and look at the Console.
    console.info('[rhythm]', result.status, {
      expectedAt: run.current.expected.map((t) => Math.round(t - run.current.expected[0])),
      pressedAt: run.current.onsets.map((t) => Math.round(t - run.current.expected[0])),
      windowMs: Math.round(result.windowMs),
    });
    setScore(result);
    setActive(-1);
    onAttempt?.(result.status === 'ok');
    if (result.status === 'ok') {
      cue('done');
      later(onDone, DONE_PAUSE_MS);
    } else {
      cue('wrong');
      later(begin, RETRY_PAUSE_MS);
    }
  };

  function begin() {
    engine.current?.stop();
    run.current = { onsets: [], expected: [], phase: 'running' };
    setPhase('running');
    setScore(null);
    setActive(-1);
    let endScheduled = false;
    const eng = new MetronomeEngine(() => ({
      bpm: step.bpm,
      beatsPerBar,
      ticksPerBeat: 2, // a tick on every half beat, so eighth notes can light up; the click is on whole beats
      click: true,
      onSchedule: (tick) => {
        if (tick.index === beatsPerBar * 2) {
          // first beat after the count-in: when should each note sound, on the performance.now() clock?
          const startMs = performance.now() + (tick.time - getAudioContext().currentTime) * 1000;
          run.current.expected = sounding(pattern).map((n) => startMs + n.start * spbMs);
        }
      },
      onTick: (tick) => {
        if (tick.index < beatsPerBar * 2) {
          if (tick.isBeat) setCount(beatsPerBar - tick.beat);
          return;
        }
        setCount(null);
        const beat = tick.beat - beatsPerBar;
        if (beat >= totalBeats) {
          if (!endScheduled) {
            endScheduled = true;
            later(finish, 700); // let the last note's detection arrive
          }
          return;
        }
        const idx = notes.findIndex((n) => beat >= n.startBeat && beat < n.startBeat + n.beats);
        if (idx >= 0) setActive(idx);
      },
    }));
    engine.current = eng;
    eng.start();
  }

  /** Play the pattern once so the player hears what to aim for, then start the count-in. */
  function listen() {
    setPhase('listening');
    const t0 = getAudioContext().currentTime + DEMO_LEAD_MS / 1000;
    notes.forEach((n, i) => {
      if (!n.rest) playNote(DEMO_NOTE, t0 + (n.startBeat * spbMs) / 1000, Math.min(0.45, (n.beats * spbMs) / 1000));
      later(() => setActive(i), DEMO_LEAD_MS + n.startBeat * spbMs);
    });
    later(begin, DEMO_LEAD_MS + totalBeats * spbMs + DEMO_TAIL_MS);
  }

  /** Drop whatever is happening: pending timers, the click, the attempt. */
  const halt = () => {
    timers.clear();
    engine.current?.stop();
    run.current = { onsets: [], expected: [], phase: 'ready' };
    setCount(null);
    setScore(null);
    setActive(-1);
  };

  /** "Hear it again": drop whatever is happening, play the pattern, then count in as usual. */
  const replay = () => {
    stopAllSound(); // silence a demo that is still sounding
    halt();
    listen();
  };

  /** "Stop": silence everything and wait until the player asks to go again. */
  const stop = () => stopAllSound(); // the onStopAll listener below does the rest

  const startAgain = () => {
    halt();
    begin();
  };

  // The Stop button here, or "Stop sound" in the menu bar: no more retries until asked.
  useEffect(() => onStopAll(() => {
    halt();
    setPhase('stopped');
  }), []);

  useEffect(() => {
    speak(step.title);
    if (step.listen) later(listen, 600);
    else later(begin, 900);
    return () => {
      engine.current?.stop();
      run.current.phase = 'stopped';
    };
    // runs once per step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rhythm-step" data-testid="rhythm-step" data-phase={phase} data-active={active} data-expected={sounding(pattern).length}>
      <h2>{step.title}</h2>
      {step.body && <p className="explain">{step.body}</p>}
      <div className="count-box">
        {count !== null ? (
          <div className="beat-dots" aria-label="Count-in">
            {Array.from({ length: beatsPerBar }, (_, i) => (
              <span key={i} className={`dot${i === beatsPerBar - count ? ' on' : ''}${i === 0 ? ' downbeat' : ''}`} />
            ))}
          </div>
        ) : <span className="muted">{phase === 'running' ? 'Play a key on every note that lights up' : ' '}</span>}
      </div>
      <StaffNotation notes={notes} beatsPerBar={beatsPerBar} activeIndex={active} maxBarsPerLine={2} />
      <p>
        <button onClick={replay} disabled={phase === 'listening'} title="Play this rhythm at its tempo, then count in again">
          <SpeakerIcon /> Hear it again
        </button>{' '}
        {phase === 'stopped' ? (
          <button className="primary" onClick={startAgain} title="Count in and try the rhythm">
            <RestartIcon /> Try it
          </button>
        ) : (
          <button onClick={stop} title="Stop the click and the demo">
            <StopIcon /> Stop
          </button>
        )}
      </p>
      <p className={`feedback-line${score ? (score.status === 'ok' ? ' is-done' : ' is-wrong') : ''}`} aria-live="polite">
        {score
          ? message(score, received)
          : phase === 'listening'
            ? 'Listen first: this is what you will play…'
            : phase === 'ready'
              ? 'Get ready…'
              : phase === 'stopped'
                ? 'Stopped. Press “Try it” when you are ready, or “Hear it again” to listen first.'
                : ' '}
      </p>
    </div>
  );
}
