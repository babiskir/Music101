import { useState } from 'react';
import { classes } from '../classes/registry';

const STORAGE_KEY = 'music101.class';

function loadClassId(): string {
  // ?class=reading-notes opens a class directly (handy for bookmarks).
  const fromUrl = new URLSearchParams(window.location.search).get('class');
  if (fromUrl && classes.some((c) => c.id === fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && classes.some((c) => c.id === saved)) return saved;
  } catch {
    /* storage unavailable: fall through */
  }
  return classes[0].id;
}

export function App() {
  const [classId, setClassId] = useState(loadClassId);
  const current = classes.find((c) => c.id === classId) ?? classes[0];

  const choose = (id: string) => {
    setClassId(id);
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
          Class{' '}
          <select value={classId} onChange={(e) => choose(e.target.value)}>
            {classes.map((c, i) => (
              <option key={c.id} value={c.id}>{i + 1}. {c.title}</option>
            ))}
          </select>
        </label>
      </header>
      <p className="class-summary">{current.summary}</p>
      {/* key so each class starts with fresh state */}
      <current.Component key={current.id} />
    </main>
  );
}
