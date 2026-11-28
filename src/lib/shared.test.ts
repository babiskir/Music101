import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { starHeadline } from '../games/scoring';
import { levelOf } from '../games/useSceneGame';
import { keysAccepting, nameTarget } from '../guide/targets';
import { createSignal } from './signal';
import { numberFields, storage, storedTable } from './storage';

/** A stand-in for the browser's localStorage. */
function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe('storedTable', () => {
  beforeEach(() => vi.stubGlobal('localStorage', fakeStorage()));
  afterEach(() => vi.unstubAllGlobals());

  const table = () => storedTable('test', numberFields<{ n: number }>('n'));

  it('saves and reads entries by id', () => {
    table().set('a', { n: 1 });
    table().set('b', { n: 2 });
    expect(table().get('a')).toEqual({ n: 1 });
    expect(table().all()).toEqual({ a: { n: 1 }, b: { n: 2 } });
  });

  it('leaves out broken entries and survives broken data', () => {
    storage.set('test', { good: { n: 3 }, bad: { n: 'x' }, worse: null });
    expect(table().all()).toEqual({ good: { n: 3 } });
    storage.set('test', [1, 2]);
    expect(table().all()).toEqual({});
  });
});

describe('createSignal', () => {
  it('calls every listener until it unsubscribes', () => {
    const s = createSignal();
    const a = vi.fn();
    const b = vi.fn();
    const offA = s.subscribe(a);
    s.subscribe(b);
    s.emit();
    offA();
    s.emit();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
  });
});

describe('small game helpers', () => {
  it('starHeadline picks the line for the stars', () => {
    expect(starHeadline(0, ['zero', 'one', 'two', 'three'])).toBe('zero');
    expect(starHeadline(3, ['zero', 'one', 'two', 'three'])).toBe('three');
  });

  it('levelOf falls back to the first level', () => {
    const levels = [{ id: 'easy' }, { id: 'hard' }];
    expect(levelOf(levels, 'hard')).toBe(levels[1]);
    expect(levelOf(levels, 'nope')).toBe(levels[0]);
  });

  it('keysAccepting lists every octave of a note name in the range', () => {
    expect(keysAccepting(nameTarget(60), 48, 84)).toEqual([48, 60, 72, 84]);
  });
});
