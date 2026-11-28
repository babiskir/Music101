import { useEffect, useRef, useState } from 'react';
import { usePianoNotes } from '../../input/PianoInput';

const GLOW_MS = 700;

/**
 * The keys played in the last moment, on the piano or on the screen, so the sheet music can light up
 * the note you just played. Call `press` for on-screen clicks; piano keys are picked up by themselves.
 */
export function useRecentKeys(): { keys: number[]; press: (midi: number) => void } {
  const [keys, setKeys] = useState<number[]>([]);
  const timers = useRef(new Map<number, number>());

  const press = (midi: number) => {
    window.clearTimeout(timers.current.get(midi));
    setKeys((k) => (k.includes(midi) ? k : [...k, midi]));
    timers.current.set(
      midi,
      window.setTimeout(() => {
        timers.current.delete(midi);
        setKeys((k) => k.filter((m) => m !== midi));
      }, GLOW_MS),
    );
  };

  usePianoNotes((e) => press(e.midi));
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  return { keys, press };
}
