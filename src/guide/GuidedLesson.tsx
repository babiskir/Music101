import { useEffect, useRef, useState } from 'react';
import { peekAudioContext } from '../audio/audioContext';
import { usePiano, usePianoNotes } from '../input/PianoInput';
import type { LessonDef } from '../lessons/types';
import { numberBetween } from '../lib/storage';
import { formatLifetime, useLifetimeStats } from '../lib/useLifetimeStats';
import { usePersistentState } from '../lib/usePersistentState';
import { speak } from './feedback';
import { InfoStepView } from './InfoStepView';
import { PlayStepView } from './PlayStepView';
import { RhythmStepView } from './RhythmStepView';

interface Props {
  lesson: LessonDef;
  /** Called once when the last step is finished. */
  onComplete: () => void;
  nextTitle?: string;
  onNext?: () => void;
}

/** True while the browser still blocks sound (until the page gets a click or key press). */
function useAudioBlocked(): boolean {
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const check = () => setBlocked(peekAudioContext()?.state === 'suspended');
    check();
    const id = window.setInterval(check, 1000);
    return () => window.clearInterval(id);
  }, []);
  return blocked;
}

/**
 * Runs a lesson as a guided session on the piano: one step at a time, the app tells you what to
 * play, listens, and moves on by itself. Playing any key is the "Next" button.
 */
export function GuidedLesson({ lesson, onComplete, nextTitle, onNext }: Props) {
  const steps = lesson.steps;
  const piano = usePiano();
  const audioBlocked = useAudioBlocked();
  const { lifetime, record } = useLifetimeStats(`lesson.${lesson.id}`);
  const [saved, setSaved] = usePersistentState(`guide.step.${lesson.id}`, 0, numberBetween(0, 500));
  const [finished, setFinished] = useState(false);
  const [run, setRun] = useState(0); // bump to rebuild the current step (new random prompts)
  const resumed = useRef(saved > 0);

  const index = Math.min(saved, steps.length - 1);
  const step = steps[index];

  const goTo = (i: number) => {
    resumed.current = false;
    if (i >= steps.length) {
      setFinished(true);
      setSaved(0);
      onComplete();
    } else {
      setSaved(Math.max(0, i));
      setRun((r) => r + 1);
    }
  };

  // Read information steps aloud when spoken instructions are on.
  useEffect(() => {
    if (!finished && step.kind === 'info') speak(`${step.title}. ${step.body.join(' ')}`);
  }, [step, finished]);

  // PC keyboard shortcuts for when your hands are free: ← back, → skip.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, select, textarea, [role="menu"], [role="menubar"]')) return;
      if (e.key === 'ArrowRight' && !finished) goTo(index + 1);
      else if (e.key === 'ArrowLeft' && !finished && index > 0) goTo(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (finished) {
    return <FinishedCard lesson={lesson} stats={formatLifetime(lifetime)} nextTitle={nextTitle} onNext={onNext} onAgain={() => { setFinished(false); setRun((r) => r + 1); }} />;
  }

  const stepKey = `${lesson.id}-${index}-${run}`;
  return (
    <section className="card guide">
      <div className="guide-progress" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={index + 1} aria-label="Lesson progress">
        <div className="guide-progress-bar" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
      </div>
      <p className="guide-meta">
        Step {index + 1} / {steps.length}
        {resumed.current && <> · continuing where you left off · <button className="link" onClick={() => goTo(0)}>start over</button></>}
      </p>

      {!piano.connected && (
        <p className="hint-box">
          No keyboard connected. The lessons are made to be played on your piano: use the button at the top right
          (or the Keyboard menu) to connect it. You can still click the on-screen keys to try things out.
        </p>
      )}
      {audioBlocked && (
        <p className="hint-box error">Sound is blocked by the browser until you click anywhere on this page once.</p>
      )}

      {step.kind === 'info' && <InfoStepView key={stepKey} step={step} onDone={() => goTo(index + 1)} />}
      {step.kind === 'play' && (
        <PlayStepView key={stepKey} step={step} onAttempt={record} onDone={() => goTo(index + 1)} />
      )}
      {step.kind === 'rhythm' && <RhythmStepView key={stepKey} step={step} onDone={() => goTo(index + 1)} />}

      <div className="guide-controls">
        <button onClick={() => goTo(index - 1)} disabled={index === 0}>← Back</button>
        <button onClick={() => goTo(index + 1)}>Skip →</button>
        <button onClick={() => goTo(0)}>Restart lesson</button>
        <span className="muted">Tip: the ← → keys on your PC keyboard also go back / skip.</span>
      </div>
    </section>
  );
}

function FinishedCard({ lesson, stats, nextTitle, onNext, onAgain }: {
  lesson: LessonDef; stats: string; nextTitle?: string; onNext?: () => void; onAgain: () => void;
}) {
  const shownAt = useRef(performance.now());
  usePianoNotes(() => {
    if (onNext && performance.now() - shownAt.current > 1500) onNext();
  });

  return (
    <section className="card guide finished" data-testid="lesson-finished">
      <h2>🎉 Lesson complete: {lesson.title}</h2>
      <p className="muted">{stats}</p>
      {nextTitle && onNext ? (
        <p className="continue-line">🎹 Play any key to go on to: <strong>{nextTitle}</strong></p>
      ) : (
        <p className="explain">That was the last lesson for now.</p>
      )}
      <div className="row">
        {onNext && <button className="primary" onClick={onNext}>Next: {nextTitle} →</button>}
        <button onClick={onAgain}>Do this lesson again</button>
      </div>
    </section>
  );
}
