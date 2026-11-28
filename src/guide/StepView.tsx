import { ChooseStepView } from './ChooseStepView';
import { InfoStepView } from './InfoStepView';
import { PlayStepView } from './PlayStepView';
import { RhythmStepView } from './RhythmStepView';
import type { Step } from './types';

interface Props {
  step: Step;
  onDone: () => void;
  /** Every judged answer: a key press, a tapped answer, one try at a rhythm. */
  onAttempt?: (ok: boolean) => void;
}

/** Any step, drawn by its own view. Give it a `key` so a new step starts fresh. */
export function StepView({ step, onDone, onAttempt = () => {} }: Props) {
  switch (step.kind) {
    case 'info':
      return <InfoStepView step={step} onDone={onDone} />;
    case 'play':
      return <PlayStepView step={step} onAttempt={onAttempt} onDone={onDone} />;
    case 'rhythm':
      return <RhythmStepView step={step} onAttempt={onAttempt} onDone={onDone} />;
    case 'choose':
      return <ChooseStepView step={step} onAttempt={onAttempt} onDone={onDone} />;
  }
}
