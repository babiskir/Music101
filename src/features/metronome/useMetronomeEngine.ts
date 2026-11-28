import { useCallback, useEffect, useRef, useState } from 'react';
import { MetronomeEngine, type MetronomeConfig } from '../../audio/MetronomeEngine';
import { onStopAll } from '../../audio/audioContext';

type Options = Omit<MetronomeConfig, 'ticksPerBeat' | 'click'> &
  Partial<Pick<MetronomeConfig, 'ticksPerBeat' | 'click'>>;

/** React wrapper around MetronomeEngine. Always uses the latest options (no stale closures). */
export function useMetronomeEngine(options: Options) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const engineRef = useRef<MetronomeEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new MetronomeEngine(() => ({
      ticksPerBeat: 1,
      click: true,
      ...optionsRef.current,
    }));
  }
  const engine = engineRef.current;

  const [running, setRunning] = useState(false);

  const start = useCallback(() => {
    engine.start();
    setRunning(true);
  }, [engine]);

  const stop = useCallback(() => {
    engine.stop();
    setRunning(false);
  }, [engine]);

  useEffect(() => () => engine.stop(), [engine]);
  // "Stop sound" halts the engine directly; keep the Start/Stop button in step.
  useEffect(() => onStopAll(() => setRunning(false)), []);

  return { running, start, stop };
}
