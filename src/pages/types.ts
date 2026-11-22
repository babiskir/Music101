import type { ComponentType } from 'react';

export interface PageProps {
  /** Jump to another page by id (e.g. from Help to the microphone settings). */
  openPage: (id: string) => void;
}

/** A page is a screen that is not a lesson: settings, help. Reached from the menu bar. */
export interface PageDef {
  id: string;
  title: string;
  Component: ComponentType<PageProps>;
}
