import { isCueActive } from '../guide/feedback';
import { usePiano, usePianoNotes } from '../input/PianoInput';

/**
 * Call `handler` for every key pressed on the connected keyboard. With the microphone, presses right
 * after the app's own beeps are ignored (the microphone would hear them as notes); rhythm games turn
 * that off because they make no beeps on hits.
 */
export function useGameKeys(handler: (midi: number, timeMs: number) => void, ignoreOwnSounds = true): void {
  const piano = usePiano();
  usePianoNotes((e) => {
    if (ignoreOwnSounds && piano.source === 'mic' && isCueActive()) return;
    handler(e.midi, e.time);
  });
}
