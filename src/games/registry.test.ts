import { describe, expect, it } from 'vitest';
import { lessons } from '../lessons/registry';
import { games } from './registry';

describe('games', () => {
  it('have unique ids, with unique level ids inside each game', () => {
    expect(new Set(games.map((g) => g.id)).size).toBe(games.length);
    for (const g of games) {
      expect(g.levels.length).toBeGreaterThan(0);
      expect(new Set(g.levels.map((l) => l.id)).size).toBe(g.levels.length);
    }
  });

  it('practise lessons that exist', () => {
    const ids = new Set(lessons.map((l) => l.id));
    for (const g of games) {
      expect(g.lessons.length).toBeGreaterThan(0);
      for (const id of g.lessons) expect(ids.has(id), `${g.id} mentions ${id}`).toBe(true);
    }
  });

  it('say how to play, in plain words (no octave numbers like C4)', () => {
    for (const g of games) {
      expect(g.howTo.length).toBeGreaterThan(0);
      for (const text of [g.tagline, ...g.howTo, ...g.levels.flatMap((l) => [l.title, l.blurb])]) {
        expect(text, text).not.toMatch(/\b[A-G][#b]?[0-9]\b/);
      }
    }
  });
});
