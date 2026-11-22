import type { PageDef } from './types';
import { MicSettings } from './mic-settings/MicSettings';
import { HelpPage } from './help/HelpPage';

export const pages: PageDef[] = [
  { id: 'mic-settings', title: 'Microphone & input', Component: MicSettings },
  { id: 'help', title: 'Help: connecting your keyboard', Component: HelpPage },
];
