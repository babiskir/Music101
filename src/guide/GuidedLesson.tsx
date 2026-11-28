import { useEffect, useRef, useState } from 'react';
import { peekAudioContext, stopAllSound } from '../audio/audioContext';
import { usePiano, usePianoNotes } from '../input/PianoInput';
import type { LessonDef } from '../lessons/types';
import { numberBetween } from '../lib/storage';
import { formatLifetime, useLifetimeStats } from '../lib/useLifetimeStats';
import { usePersistentState } from '../lib/usePersistentState';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, RestartIcon } from '../app/icons';
import { speak } from './feedback';
import { StepView } from './StepView';

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
    stopAllSound(); // notes and clicks of the step you leave must not keep playing
    if (i >= steps.length) {
      setFinished(true);
      setSaved(0);
      onComplete();
    } else {
      setSaved(Math.max(0, i));
      setRun((r) => r + 1);
    }
  };

  // Leaving the lesson (another lesson, a page): silence it.
  useEffect(() => () => stopAllSound(), []);

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
      <div className="step-head">
        <ol className="steps-track" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={index + 1} aria-label="Lesson progress">
          {steps.map((s, i) => (
            <li key={i} className={i < index ? 'done' : i === index ? 'current' : ''}>
              <button title={`Step ${i + 1}: ${s.title}`} aria-label={`Go to step ${i + 1}: ${s.title}`} onClick={() => goTo(i)} />
            </li>
          ))}
        </ol>
        <span className="step-count">Step {index + 1} of {steps.length}</span>
      </div>

      <div className="guide-body">
        {resumed.current && (
          <p className="resume-note">
            Continuing where you left off. <button className="link" onClick={() => goTo(0)}>Start from the beginning</button>
          </p>
        )}

        {!piano.connected && (
          <p className="hint-box">
            {piano.lost
              ? 'Your keyboard disappeared: it has probably switched itself off (Auto Power Off). Switch it on again and this page reconnects by itself.'
              : 'No keyboard connected. The lessons are made to be played on your piano: use the button at the top right (or the Keyboard menu) to connect it.'}{' '}
            You can still click the on-screen keys to try things out.
          </p>
        )}
        {audioBlocked && (
          <p className="hint-box error">Sound is blocked by the browser until you click anywhere on this page once.</p>
        )}

        <StepView key={stepKey} step={step} onAttempt={record} onDone={() => goTo(index + 1)} />

        </div>

        <div className="guide-controls">
          <button className="ghost" onClick={() => goTo(index - 1)} disabled={index === 0} title="Previous step (← key)">
            <ArrowLeftIcon /> Back
          </button>
          <button className="ghost" onClick={() => goTo(0)} title="Start this lesson again">
            <RestartIcon /> Restart
          </button>
          <span className="spacer" />
          <button className="ghost" onClick={() => goTo(index + 1)} title="Skip this step (→ key)">
            Skip step <ArrowRightIcon />
          </button>
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
        <div className="finished-mark"><CheckIcon /></div>
        <p className="eyebrow" style={{ justifyContent: 'center', marginTop: 16 }}>Lesson complete</p>
        <h2>{lesson.title}</h2>
        <p className="muted">{stats}</p>
        <div className="row">
          {onNext && <button className="primary" onClick={onNext}>Next: {nextTitle} <ArrowRightIcon /></button>}
          <button onClick={onAgain}>Do this lesson again</button>
        </div>
        {nextTitle && onNext ? (
          <p className="continue-line">or play any key on your piano to go on</p>
        ) : (
          <p className="continue-line">That was the last lesson for now.</p>
        )}
      </section>
    );
  }
