import { useEffect, useRef } from 'react';
import { midiToPitch } from '../domain/notes';
import { Keyboard } from '../features/keyboard/Keyboard';
import { playNow } from '../audio/sounds';
import { StaffNotation } from '../features/staff/StaffNotation';
import { useRecentKeys } from '../features/staff/useRecentKeys';
import { labelsFor } from './labels';
import { usePianoNotes } from '../input/PianoInput';
import type { InfoStep } from './types';

const GRACE_MS = 700; // ignore the key press that just finished the previous step

/** Read it, then play any key on the piano to continue. */
export function InfoStepView({ step, onDone }: { step: InfoStep; onDone: () => void }) {
  const mountedAt = useRef(performance.now());
  const finished = useRef(false);
  const recent = useRecentKeys();
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
      {step.staff && (
        <div className="staff-narrow">
          <StaffNotation
            notes={step.staff.notes.map((m, i) => ({ pitch: midiToPitch(m), beats: 1, startBeat: i }))}
            beatsPerBar={step.staff.notes.length}
            activeIndex={-1}
            maxBarsPerLine={1}
            timeSignature={false}
            labels={labelsFor(step.staff.notes, step.staff.labels)}
            clef={step.staff.clef}
            glow={recent.keys}
          />
        </div>
      )}
      {step.keyboard && (
        <Keyboard
          from={step.keyboard.from}
          to={step.keyboard.to}
          highlights={step.keyboard.keys ?? {}}
          showNames={step.keyboard.names ?? true}
          onKeyPress={(m) => {
            playNow(m);
            recent.press(m);
          }}
        />
      )}
      <div className="continue">
        <button className="primary" onClick={go}>Continue</button>
        <span className="muted">or play any key on your piano</span>
      </div>
    </div>
  );
}
