import type { ComponentType } from 'react';

/**
 * A lesson is one teaching module: a short goal list (shown by the app shell) plus a
 * screen that owns its own layout and composes reusable widgets from src/features.
 */
export interface LessonDef {
  id: string;
  title: string;
  /** One line shown under the dropdown. */
  summary: string;
  /** "After this lesson you can..." bullets, shown above the lesson. */
  goals: string[];
  Component: ComponentType;
}
