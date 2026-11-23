import { useState } from 'react';
import { setSpeak, useSpeak } from '../guide/feedback';
import { GuidedLesson } from '../guide/GuidedLesson';
import { PianoStatus } from '../input/PianoStatus';
import { usePiano } from '../input/PianoInput';
import { lessons } from '../lessons/registry';
import { useProgress } from '../lessons/progress';
import { storage } from '../lib/storage';
import { pages } from '../pages/registry';
import { MenuBar, type MenuDef } from './MenuBar';

const REPO_URL = 'https://github.com/babiskir/Music101';

function loadLessonId(): string {
  // ?lesson=hand-position opens a lesson directly (handy for bookmarks).
  const fromUrl = new URLSearchParams(window.location.search).get('lesson');
  if (fromUrl && lessons.some((l) => l.id === fromUrl)) {
    storage.set('lesson', fromUrl); // opening a link counts as choosing that lesson
    return fromUrl;
  }
  return storage.get('lesson', lessons[0].id, (v): v is string => lessons.some((l) => l.id === v));
}

function loadPageId(): string | null {
  // ?page=mic-settings opens a page directly. "?lesson=mic-check" was the old address of the mic screen.
  const params = new URLSearchParams(window.location.search);
  const id = params.get('page') ?? (params.get('lesson') === 'mic-check' ? 'mic-settings' : null);
  return id && pages.some((p) => p.id === id) ? id : null;
}

export function App() {
  const [lessonId, setLessonId] = useState(loadLessonId);
  const [pageId, setPageId] = useState<string | null>(loadPageId);
  const { done, toggle, markDone } = useProgress();
  const piano = usePiano();
  const speaking = useSpeak();

  const index = Math.max(0, lessons.findIndex((l) => l.id === lessonId));
  const current = lessons[index];
  const isDone = done.includes(current.id);
  const nextLesson = lessons[index + 1];
  const connectionProblem = piano.error ?? (piano.mic.state.status === 'error' ? piano.mic.state.error : undefined);
  const page = pageId ? pages.find((p) => p.id === pageId) ?? null : null;

  const openLesson = (id: string) => {
    setLessonId(id);
    setPageId(null);
    window.scrollTo({ top: 0 });
    storage.set('lesson', id);
  };

  const openPage = (id: string) => {
    setPageId(id);
    window.scrollTo({ top: 0 });
  };

  const resetAll = () => {
    if (window.confirm('Forget all saved progress, scores and settings?')) {
      storage.clearAll();
      window.location.href = window.location.pathname; // reload without ?lesson= / ?page=
    }
  };

  const menus: MenuDef[] = [
    {
      id: 'lessons',
      label: 'Lessons',
      items: [
        ...lessons.map((l, i) => ({
          id: l.id,
          label: `${done.includes(l.id) ? '✓ ' : ''}${i + 1}. ${l.title}`,
          current: !page && l.id === current.id,
          onSelect: () => openLesson(l.id),
        })),
        { id: 'sep-progress', separator: true },
        {
          id: 'mark-done',
          label: isDone ? `Undo “done” for lesson ${index + 1}` : `Mark lesson ${index + 1} as done`,
          onSelect: () => toggle(current.id),
        },
        {
          id: 'next',
          label: nextLesson ? `Next lesson: ${nextLesson.title} →` : 'Next lesson (you are on the last one)',
          disabled: !nextLesson,
          onSelect: () => nextLesson && openLesson(nextLesson.id),
        },
      ],
    },
    {
      id: 'keyboard',
      label: 'Keyboard',
      items: [
        {
          id: 'status',
          heading: true,
          label: piano.connected ? `Connected: ${piano.deviceName || 'keyboard'}` : 'Not connected',
        },
        { id: 'connect-auto', label: 'Connect (automatic)', disabled: piano.connected, onSelect: () => void piano.connect() },
        { id: 'connect-mic', label: 'Connect: cable / microphone', disabled: piano.source === 'mic', onSelect: () => void piano.connectMic() },
        { id: 'connect-midi', label: 'Connect: USB (MIDI)', disabled: piano.source === 'midi', onSelect: () => void piano.connectMidi() },
        { id: 'disconnect', label: 'Disconnect', disabled: !piano.connected, onSelect: piano.disconnect },
        { id: 'sep-kb', separator: true },
        { id: 'mic-settings', label: 'Microphone & input settings…', onSelect: () => openPage('mic-settings') },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [{ id: 'metronome', label: 'Metronome…', current: pageId === 'metronome', onSelect: () => openPage('metronome') }],
    },
    {
      id: 'settings',
      label: 'Settings',
      align: 'right',
      items: [
        { id: 'mic-settings', label: 'Microphone & input…', current: pageId === 'mic-settings', onSelect: () => openPage('mic-settings') },
        {
          id: 'speak',
          label: `${speaking ? '✓ ' : ''}Spoken instructions`,
          onSelect: () => setSpeak(!speaking),
        },
        { id: 'sep-reset', separator: true },
        { id: 'reset', label: 'Reset saved progress and settings…', onSelect: resetAll },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      align: 'right',
      items: [
        { id: 'help', label: 'Connecting your keyboard…', current: pageId === 'help', onSelect: () => openPage('help') },
        { id: 'sep-help', separator: true },
        { id: 'github', label: 'Project on GitHub', href: REPO_URL },
      ],
    },
  ];

  return (
    <main className="app">
      <MenuBar
        brand="🎹 Music101"
        menus={menus}
        right={<PianoStatus onOpenSettings={() => openPage('mic-settings')} />}
      />

      {connectionProblem && !piano.connected && <p className="hint-box error">{connectionProblem}</p>}

      {page ? (
        <>
          <div className="page-head">
            <button onClick={() => setPageId(null)}>← Back to lesson {index + 1}: {current.title}</button>
          </div>
          <page.Component key={page.id} openPage={openPage} />
        </>
      ) : (
        <>
          <section className="card goals">
            <h1 className="lesson-title">
              {index + 1}. {current.title} <small>lesson {index + 1} of {lessons.length}{isDone ? ' · ✓ done' : ''}</small>
            </h1>
            <p className="class-summary">{current.summary}</p>
            <h3>After this lesson you can…</h3>
            <ul>
              {current.goals.map((g) => <li key={g}>{g}</li>)}
            </ul>
          </section>

          {/* key so each lesson starts fresh */}
          <GuidedLesson
            key={current.id}
            lesson={current}
            onComplete={() => markDone(current.id)}
            nextTitle={nextLesson?.title}
            onNext={nextLesson ? () => openLesson(nextLesson.id) : undefined}
          />
        </>
      )}

      <p className="reset-row">
        Progress and settings are saved in this browser.{' '}
        <button className="link" onClick={resetAll}>Reset everything</button>
      </p>
    </main>
  );
}
