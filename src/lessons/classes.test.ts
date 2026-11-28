import { describe, expect, it } from 'vitest';
import { classes, lessonsOf } from './classes';
import { lessons } from './registry';

describe('classes', () => {
  it('put every lesson in exactly one class', () => {
    const ids = classes.flatMap((c) => c.lessonIds);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(lessons.map((l) => l.id).sort());
  });

  it('keep the learning order of the registry', () => {
    expect(classes.flatMap((c) => c.lessonIds)).toEqual(lessons.map((l) => l.id));
  });

  it('only name lessons that exist', () => {
    for (const c of classes) expect(() => lessonsOf(c)).not.toThrow();
  });
});
