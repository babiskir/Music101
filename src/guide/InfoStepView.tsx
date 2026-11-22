import { useEffect, useRef } from 'react';
import { Keyboard } from '../features/keyboard/Keyboard';
import { usePianoNotes } from '../input/PianoInput';
import type { InfoStep } from './types';

const GRACE_MS = 700; // ignore the key press that just finished the previous step

/** Read it, then play any key on the piano to continue. */
export function InfoStepView({ step, onDone }: { step: InfoStep; onDone: () => void }) {
  const mountedAt = useRef(performance.now());
  const finished = useRef(false);
  useEffect(() => {
    mountedAt.current = performance.now();
    finished.current = false;
  }, [step]);

  const go = () => {
    if (finished.current) return;
    finished.current = true;
    onDone();
  };
  usePianoNotes(() => {
    if (performance.now() - mountedAt.current > GRACE_MS) go();
  });

  return (
    <div className="info-step" data-testid="info-step">
      <h2>{step.title}</h2>
      {step.body.map((p) => <p key={p} className="explain">{p}</p>)}
      {step.list && <ul>{step.list.map((li) => <li key={li}>{li}</li>)}</ul>}
      {step.keyboard && (
        <Keyboard
          from={step.keyboard.from}
          to={step.keyboard.to}
          highlights={step.keyboard.keys ?? {}}
          showNames={step.keyboard.names ?? true}
        />
      )}
      <p className="continue-line">🎹 Play any key on your keyboard to continue</p>
      <button onClick={go}>Continue</button>
    </div>
  );
}
