import type { PageDef } from './types';
import { MicSettings } from './mic-settings/MicSettings';
import { HelpPage } from './help/HelpPage';
import { MetronomePage } from './metronome/MetronomePage';

export const pages: PageDef[] = [
  { id: 'metronome', title: 'Metronome', Component: MetronomePage },
  { id: 'mic-settings', title: 'Microphone & input', Component: MicSettings },
  { id: 'help', title: 'Help: connecting your keyboard', Component: HelpPage },
];
