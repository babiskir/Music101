import { useState } from 'react';
import { lessons } from '../lessons/registry';
import { useProgress } from '../lessons/progress';
import { storage } from '../lib/storage';

function loadLessonId(): string {
  // ?lesson=hand-position opens a lesson directly (handy for bookmarks).
  const fromUrl = new URLSearchParams(window.location.search).get('lesson');
  if (fromUrl && lessons.some((l) => l.id === fromUrl)) return fromUrl;
  return storage.get('lesson', lessons[0].id, (v): v is string => lessons.some((l) => l.id === v));
}

export function App() {
  const [lessonId, setLessonId] = useState(loadLessonId);
  const { done, toggle } = useProgress();
  const index = Math.max(0, lessons.findIndex((l) => l.id === lessonId));
  const current = lessons[index];
  const isDone = done.includes(current.id);
  const nextLesson = lessons[index + 1];

  const choose = (id: string) => {
    setLessonId(id);
    window.scrollTo({ top: 0 });
    storage.set('lesson', id);
  };

  const resetAll = () => {
    if (window.confirm('Forget all saved progress, scores and settings in this browser?')) {
      storage.clearAll();
      window.location.href = window.location.pathname; // reload without ?lesson=
    }
  };

  return (
    <main className="app">
      <header>
        <h1>Music101</h1>
        <label>
          Lesson{' '}
          <select value={current.id} onChange={(e) => choose(e.target.value)}>
            {lessons.map((l, i) => (
              <option key={l.id} value={l.id}>
                {done.includes(l.id) ? '✓ ' : ''}{i + 1}. {l.title}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="card goals">
        <p className="class-summary">{current.summary}</p>
        <h3>After this lesson you can…</h3>
        <ul>
          {current.goals.map((g) => <li key={g}>{g}</li>)}
        </ul>
      </section>

      {/* key so each lesson starts with fresh state */}
      <current.Component key={current.id} />

      <footer className="lesson-footer">
        <button className={isDone ? '' : 'primary'} onClick={() => toggle(current.id)}>
          {isDone ? '✓ Done (click to undo)' : 'Mark lesson as done'}
        </button>
        {nextLesson && (
          <button onClick={() => choose(nextLesson.id)}>Next: {nextLesson.title} →</button>
        )}
      </footer>
      <p className="reset-row">
        Progress and settings are saved in this browser.{' '}
        <button className="link" onClick={resetAll}>Reset everything</button>
      </p>
    </main>
  );
}
