import type { PageDef } from './types';
import { MicSettings } from './mic-settings/MicSettings';
import { HelpPage } from './help/HelpPage';
import { MetronomePage } from './metronome/MetronomePage';
import { PracticePage } from './practice/PracticePage';
import { GameScreen } from '../games/GameScreen';
import { games } from '../games/registry';
import { classes } from '../lessons/classes';
import { useProgress } from '../lessons/progress';
import { RunScreen } from '../run/RunScreen';
import { RunsPage, classRunConfig, dailyConfig } from '../run/RunsPage';

/** Each practice game is a page of its own (?page=game-note-rain), plus the list of all games. */
const gamePages: PageDef[] = games.map((game) => ({
  id: `game-${game.id}`,
  title: game.title,
  Component: ({ openPage }) => <GameScreen game={game} openPage={openPage} />,
}));

/** Practice runs: the list, today's run, and a normal and a hard run per class (?page=run-rhythm-hard). */
function DailyRun({ openPage }: { openPage: (id: string) => void }) {
  const { done } = useProgress();
  return <RunScreen config={dailyConfig(done)} onExit={() => openPage('runs')} />;
}
const runPages: PageDef[] = [
  { id: 'runs', title: 'Practice runs', Component: RunsPage },
  { id: 'run-daily', title: 'Daily run', Component: DailyRun },
  ...classes.flatMap((c) =>
    [false, true].map((hard): PageDef => {
      const config = classRunConfig(c.id, hard);
      return { id: `run-${config.id}`, title: `Run: ${config.title}`, Component: ({ openPage }) => <RunScreen config={config} onExit={() => openPage('runs')} /> };
    }),
  ),
];

export const pages: PageDef[] = [
  ...runPages,
  { id: 'practice', title: 'Practice games', Component: PracticePage },
  ...gamePages,
  { id: 'metronome', title: 'Metronome', Component: MetronomePage },
  { id: 'mic-settings', title: 'Microphone & input', Component: MicSettings },
  { id: 'help', title: 'Help: connecting your keyboard', Component: HelpPage },
];
