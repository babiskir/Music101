import { useEffect, useMemo, useRef, useState } from 'react';
import { MetronomeEngine } from '../audio/MetronomeEngine';
import { getAudioContext } from '../audio/audioContext';
import type { TimedNote } from '../domain/song';
import { StaffNotation } from '../features/staff/StaffNotation';
import { usePianoNotes } from '../input/PianoInput';
import { cue, speak } from './feedback';
import { scoreRhythm, type RhythmScore } from './rhythmScore';
import type { RhythmStep } from './types';

const RETRY_PAUSE_MS = 2800;
const DONE_PAUSE_MS = 1800;

function message(s: RhythmScore): string {
  switch (s.status) {
    case 'ok':
      return `✓ Steady! Every note was within ${Math.round(s.windowMs)} ms of the beat.`;
    case 'missing':
      return `I heard ${s.heard} of ${s.expected} notes. Play one key for every note on the sheet. Trying again…`;
    case 'extra':
      return `I heard ${s.heard} notes but the sheet has ${s.expected}. Trying again…`;
    case 'uneven':
      return `A bit uneven: one note was ${Math.round(s.maxDevMs)} ms off the beat. Trying again…`;
  }
}

/**
 * Count-in, then play one key per note, any key, in time with the click. The app grades how evenly
 * you landed on the beats (see scoreRhythm) and repeats until it is steady.
 */
export function RhythmStepView({ step, onDone }: { step: RhythmStep; onDone: () => void }) {
  const beatsPerBar = step.beatsPerBar ?? 4;
  const spbMs = (60 / step.bpm) * 1000;
  const notes = useMemo<TimedNote[]>(() => {
    let at = 0;
    return step.beats.map((b) => {
      const n: TimedNote = { pitch: 'B4', beats: b, startBeat: at };
      at += b;
      return n;
    });
  }, [step]);
  const totalBeats = step.beats.reduce((a, b) => a + b, 0);
  const minGap = Math.min(...step.beats);

  const [phase, setPhase] = useState<'ready' | 'running' | 'result'>('ready');
  const [count, setCount] = useState<number | null>(null);
  const [active, setActive] = useState(-1);
  const [score, setScore] = useState<RhythmScore | null>(null);
  const run = useRef({ onsets: [] as number[], expected: [] as number[], phase: 'ready' as string });
  const engine = useRef<MetronomeEngine | null>(null);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  usePianoNotes((e) => {
    if (run.current.phase === 'running') run.current.onsets.push(e.time);
  });

  const finish = () => {
    engine.current?.stop();
    const result = scoreRhythm(run.current.expected, run.current.onsets, spbMs, minGap);
    run.current.phase = 'result';
    setPhase('result');
    setScore(result);
    setActive(-1);
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
          run.current.expected = notes.map((n) => startMs + n.startBeat * spbMs);
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

  useEffect(() => {
    speak(step.title);
    later(begin, 900);
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      engine.current?.stop();
      run.current.phase = 'stopped';
    };
    // runs once per step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rhythm-step" data-testid="rhythm-step" data-phase={phase} data-active={active} data-expected={notes.length}>
      <h2>{step.title}</h2>
      {step.body && <p className="explain">{step.body}</p>}
      <div className="count-box">
        {count !== null ? <span className="count-in">{count}</span> : <span className="muted">{phase === 'running' ? 'Play a key on every note that lights up' : ' '}</span>}
      </div>
      <StaffNotation notes={notes} beatsPerBar={beatsPerBar} activeIndex={active} maxBarsPerLine={2} />
      <p className="feedback-line" aria-live="polite">
        {score ? message(score) : phase === 'ready' ? 'Get ready…' : ' '}
      </p>
    </div>
  );
}
