import type { Step } from '../guide/types';

/**
 * A lesson is a guided session played on the piano: a goal list plus an ordered list of steps
 * (read and continue, play this, play along with the metronome). The shared runner in
 * src/guide turns it into a screen, so adding a lesson means adding data, not UI code.
 */
export interface LessonDef {
  id: string;
  title: string;
  /** One line shown at the top of the lesson. */
  summary: string;
  /** "After this lesson you can..." bullets. */
  goals: string[];
  steps: Step[];
}
