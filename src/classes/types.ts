import type { ComponentType } from 'react';

/**
 * A "class" is one lesson screen. Each class owns its own layout and composes
 * reusable widgets from src/features (keyboard, staff, metronome, ...).
 */
export interface ClassDef {
  id: string;
  title: string;
  /** One line shown under the dropdown. */
  summary: string;
  Component: ComponentType;
}
