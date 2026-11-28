import type { Choice, ChooseStep, PlayStep, RhythmStep, Step } from '../guide/types';

/**
 * What you can pick between the rounds of a run.
 *  - a twist makes every following step harder and multiplies the points (they stack);
 *  - a perk helps once.
 * Some only appear after you have played a few runs (see `unlock`).
 */
export interface Pick {
  id: string;
  kind: 'twist' | 'perk';
  title: string;
  description: string;
  /** Points multiplier while active (twists only). */
  mult?: number;
  /** Shown only when this is true for your run records. */
  unlock?: { runs?: number; wins?: number };
  /** Only offered when the run has steps this twist changes. */
  needs?: Step['kind'];
}

export const PICKS: Pick[] = [
  { id: 'blind', kind: 'twist', title: 'No names', description: 'No note names and no lit keys: read it yourself.', mult: 1.5 },
  { id: 'no-hints', kind: 'twist', title: 'No hints', description: 'The hint never appears, however long you wait.', mult: 1.25 },
  { id: 'presto', kind: 'twist', title: 'Presto', description: 'Rhythms 20% faster.', mult: 1.3, needs: 'rhythm', unlock: { runs: 1 } },
  { id: 'cold-start', kind: 'twist', title: 'Sight-read', description: 'Rhythms are not played to you first.', mult: 1.2, needs: 'rhythm', unlock: { runs: 3 } },
  { id: 'marathon', kind: 'twist', title: 'Marathon', description: 'One more step in every round.', mult: 1.3, unlock: { runs: 2 } },
  { id: 'heart', kind: 'perk', title: 'Extra heart', description: 'Get one heart back (up to 5).' },
  { id: 'shield', kind: 'perk', title: 'Shield', description: 'Your next lost heart is saved.', unlock: { wins: 1 } },
  { id: 'focus', kind: 'perk', title: 'Warm hands', description: 'Your streak jumps to 5: the next points count ×1.5.' },
];

export const pickById = (id: string): Pick | undefined => PICKS.find((p) => p.id === id);

/** Points multiplier of all the twists taken so far. */
export function multiplier(taken: string[]): number {
  return taken.reduce((m, id) => m * (pickById(id)?.mult ?? 1), 1);
}

const has = (taken: string[], id: string) => taken.includes(id);

function choicesWith(step: ChooseStep, edit: (c: Choice) => Choice): ChooseStep {
  const src = step.choices;
  return { ...step, choices: typeof src === 'function' ? () => src().map(edit) : src.map(edit) };
}

/** The step as it is played with these twists. Never changes the original. */
export function applyTwists(step: Step, taken: string[]): Step {
  const blind = has(taken, 'blind');
  const noHints = has(taken, 'no-hints');
  switch (step.kind) {
    case 'play': {
      const out: PlayStep = { ...step, show: { ...step.show } };
      if (blind) {
        out.names = false;
        out.show = { ...out.show, keys: false, fingers: false, labels: 'none' };
      }
      if (noHints) out.hintAfterMs = 1e9;
      return out;
    }
    case 'choose':
      return choicesWith(step, (c) => ({
        ...c,
        labels: blind ? 'none' : c.labels,
        hint: noHints ? undefined : c.hint,
      }));
    case 'rhythm': {
      const out: RhythmStep = { ...step };
      if (has(taken, 'presto')) out.bpm = Math.round(step.bpm * 1.2);
      if (has(taken, 'cold-start')) out.listen = false;
      return out;
    }
    default:
      return step;
  }
}
