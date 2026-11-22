import { useState } from 'react';
import { lessons } from '../lessons/registry';
import { useProgress } from '../lessons/progress';

const STORAGE_KEY = 'music101.lesson';

function loadLessonId(): string {
  // ?lesson=hand-position opens a lesson directly (handy for bookmarks).
  const fromUrl = new URLSearchParams(window.location.search).get('lesson');
  if (fromUrl && lessons.some((l) => l.id === fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && lessons.some((l) => l.id === saved)) return saved;
  } catch {
    /* storage unavailable: fall through */
  }
  return lessons[0].id;
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
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
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
    </main>
  );
}
